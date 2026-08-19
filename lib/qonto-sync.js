import { parseDateFromHeader } from './parse-date-fr.js';
import { getCalendarClient, getCalendarId, blockCalendarDay } from './google-calendar.js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function eventAlreadyCreated(calendar, invoiceId) {
  const res = await calendar.events.list({
    calendarId: getCalendarId(),
    privateExtendedProperty: `qonto_invoice_id=${invoiceId}`,
    maxResults: 1,
  });
  return (res.data.items?.length ?? 0) > 0;
}

// Les factures Qonto ne portent aucun champ `quote_id` (vérifié le 14/08/2026) — on lit la date
// directement dans l'en-tête de la facture, qui reprend celui du devis d'origine (même correctif
// que app/api/qonto/webhook/route.js).
function getEventDateFromInvoice(inv) {
  if (inv?.performance_start_date) return inv.performance_start_date.slice(0, 10);
  return parseDateFromHeader(inv?.header);
}

// BUG RÉEL du 19/08/2026, trouvé par Myrio : quand Qonto renvoie paid_at vide (facture pas
// vraiment payée — ex. virement initié puis rejeté), l'ancien code prenait par défaut la date du
// jour au lieu de rejeter l'enregistrement. Résultat : un faux paiement de 413€ enregistré avec
// la date du jour pour une facture réellement "unpaid". Corrigé : on EXIGE un paid_at réel, jamais
// de date devinée — un paiement sans date connue n'est tout simplement pas enregistré.
async function upsertPayment({ invoiceId, amount, invoiceType, paidAt, eventId, vertical }) {
  if (amount == null || !paidAt) return;
  const { error } = await supabaseAdmin.from('qonto_payments').upsert({
    qonto_invoice_id: invoiceId,
    event_id: eventId || null,
    vertical: vertical || null,
    invoice_type: invoiceType || null,
    amount: Number(amount),
    paid_at: paidAt.slice(0, 10),
    source: 'sync_cron',
  }, { onConflict: 'qonto_invoice_id' });
  if (error) console.error('[sync] qonto_payments upsert error:', error.message);
}

// Filet de sécurité CA encaissé : si le webhook temps réel a été manqué pour une facture,
// ce cron (15 min) rattrape le paiement — idempotent via qonto_invoice_id unique. Ne couvre que
// les factures dont le client a un email connu en base (voir syncPaymentsFromSignedQuotes pour
// le reste — clients Qonto sans email, créés hors site, ex. SCI Buffon découvert le 19/08/2026).
async function recordPaymentIfMissing(inv, eventDate) {
  const email = inv?.client?.email;
  if (!email || inv?.total_amount?.value == null) return;

  try {
    const { data: client } = await supabaseAdmin.from('clients').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (!client) return;

    let eventsQuery = supabaseAdmin.from('events').select('id, vertical, confirmed_at').eq('client_id', client.id).neq('status', 'annule');
    if (eventDate) eventsQuery = eventsQuery.eq('event_date', eventDate);
    const { data: matches } = await eventsQuery.order('created_at', { ascending: false }).limit(1);
    const sbEvent = matches?.[0];
    if (!sbEvent) return;

    if (!sbEvent.confirmed_at) {
      await supabaseAdmin.from('events').update({ confirmed_at: new Date().toISOString() }).eq('id', sbEvent.id);
    }

    await upsertPayment({
      invoiceId: inv.id, amount: inv.total_amount.value, invoiceType: inv.invoice_type,
      paidAt: inv.paid_at, eventId: sbEvent.id, vertical: sbEvent.vertical,
    });
  } catch (err) {
    console.error('[sync] recordPaymentIfMissing error:', err.message);
  }
}

// Filet de sécurité complémentaire : certains vrais paiements n'ont aucun événement Supabase
// correspondant (client Qonto sans email, créé directement dans Qonto sans jamais passer par le
// site) — recordPaymentIfMissing ne peut alors rien trouver. On repart cette fois du devis déjà
// classé (qonto_signed_quotes, qui connaît la verticale même sans email), et on va chercher ses
// factures directement.
async function syncPaymentsFromSignedQuotes(signedQuotes) {
  for (const sq of signedQuotes) {
    try {
      const qRes = await fetch(`${QONTO_BASE}/quotes/${sq.qonto_quote_id}`, { headers: qHeaders() });
      if (!qRes.ok) continue;
      const { quote } = await qRes.json();
      for (const invoiceId of quote?.invoice_ids || []) {
        const invRes = await fetch(`${QONTO_BASE}/client_invoices/${invoiceId}`, { headers: qHeaders() });
        if (!invRes.ok) continue;
        const { client_invoice: inv } = await invRes.json();
        if (inv?.status !== 'paid') continue;
        await upsertPayment({
          invoiceId: inv.id, amount: inv.total_amount?.value, invoiceType: inv.invoice_type,
          paidAt: inv.paid_at, eventId: sq.event_id, vertical: sq.vertical,
        });
      }
    } catch (err) {
      console.error('[sync] syncPaymentsFromSignedQuotes error:', err.message);
    }
  }
}

// Devis réellement signés (approved_at rempli — PAS juste status='approved', qui peut inclure
// des devis jamais confirmés par le client, cf. découverte du 19/08/2026). Couvre aussi bien les
// devis créés via le site que ceux créés directement dans Qonto — c'est tout l'intérêt de ce sync,
// notre propre suivi (devis_proposals/qonto_quotes_tracking) ne voit que le premier cas.
async function classifyVertical(quote) {
  const email = quote?.client?.email?.toLowerCase();
  if (email) {
    const { data: client } = await supabaseAdmin.from('clients').select('id').eq('email', email).maybeSingle();
    if (client) {
      const { data: ev } = await supabaseAdmin.from('events').select('vertical, id').eq('client_id', client.id).not('vertical', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (ev?.vertical) return { vertical: ev.vertical, eventId: ev.id };
    }
  }
  if (quote?.client?.type === 'company') return { vertical: 'professionnel', eventId: null };
  if (/mariage/i.test(quote?.header || '')) return { vertical: 'mariage', eventId: null };
  return { vertical: null, eventId: null }; // indéterminé — jamais deviné au hasard
}

async function syncSignedQuotes() {
  const res = await fetch(`${QONTO_BASE}/quotes?status=approved&per_page=100`, { headers: qHeaders() });
  if (!res.ok) { console.error('[sync] Qonto quotes fetch error:', res.status); return { synced: 0 }; }
  const data = await res.json();
  const quotes = (data.quotes || []).filter(q => q.approved_at);

  let synced = 0;
  const classified = [];
  for (const q of quotes) {
    const { vertical, eventId } = await classifyVertical(q);
    classified.push({ qonto_quote_id: q.id, vertical, event_id: eventId });
    const { error } = await supabaseAdmin.from('qonto_signed_quotes').upsert({
      qonto_quote_id: q.id,
      number: q.number || null,
      client_name: q.client?.name || null,
      client_email: q.client?.email || null,
      vertical,
      amount: Number(q.total_amount?.value) || 0,
      approved_at: q.approved_at,
      event_id: eventId,
      source: 'sync',
    }, { onConflict: 'qonto_quote_id' });
    if (error) console.error('[sync] qonto_signed_quotes upsert error:', error.message);
    else synced++;
  }
  return { synced, total: quotes.length, classified };
}

export async function runSync() {
  const { synced: quotesSynced, classified } = await syncSignedQuotes();
  await syncPaymentsFromSignedQuotes(classified);

  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const url = `${QONTO_BASE}/client_invoices?status=paid&updated_at_from=${since}&per_page=50`;
  const res = await fetch(url, { headers: qHeaders() });
  if (!res.ok) throw new Error(`Qonto client_invoices: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const invoices = data.client_invoices ?? [];
  const calendar = getCalendarClient();

  let created = 0;
  let skipped = 0;

  for (const inv of invoices) {
    const invoiceId = inv.id;
    const clientName = inv.client_name || inv.client?.name || 'Client';
    const invoiceNumber = inv.number || invoiceId;

    if (await eventAlreadyCreated(calendar, invoiceId)) {
      skipped++;
      continue;
    }

    const detailRes = await fetch(`${QONTO_BASE}/client_invoices/${invoiceId}`, { headers: qHeaders() });
    const detailData = detailRes.ok ? await detailRes.json() : {};
    const fullInv = detailData.client_invoice || inv;

    // Re-vérification défensive : la liste filtrée par status=paid peut renvoyer une facture qui,
    // au moment du détail, n'est en fait plus/pas payée (ex. virement rejeté après coup) — bug
    // réel trouvé le 19/08/2026 par Myrio. On ne fait plus confiance au seul filtre de la liste.
    if (fullInv.status !== 'paid') { skipped++; continue; }

    const eventDate = getEventDateFromInvoice(fullInv);
    await recordPaymentIfMissing(fullInv, eventDate);

    if (!eventDate) {
      skipped++;
      continue;
    }

    await blockCalendarDay({
      date: eventDate,
      summary: `🎵 Prestation Myracoustic — ${clientName}`,
      description: `Facture ${invoiceNumber} — Acompte réglé. Date confirmée.`,
      extendedProperties: { private: { qonto_invoice_id: invoiceId } },
    });
    console.log(`[sync] Agenda créé : ${eventDate} — ${clientName} (${invoiceNumber})`);
    created++;
  }

  return { created, skipped, total: invoices.length, quotesSynced };
}
