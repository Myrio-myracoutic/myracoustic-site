import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { parseDateFromHeader } from '@/lib/parse-date-fr';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function getInvoiceDetails(invoiceId) {
  const res = await fetch(`${QONTO_BASE}/client_invoices/${invoiceId}`, { headers: qHeaders() });
  if (!res.ok) return { date: null, quoteId: null };
  const data = await res.json();
  const inv = data.client_invoice;
  const quoteId = inv?.quote_id || null;

  // Priorité 1 : champ performance_start_date de la facture
  if (inv?.performance_start_date) {
    return { date: inv.performance_start_date.slice(0, 10), quoteId };
  }

  // Priorité 2 : date dans l'en-tête du devis lié
  if (!quoteId) return { date: null, quoteId: null };

  const qRes = await fetch(`${QONTO_BASE}/quotes/${quoteId}`, { headers: qHeaders() });
  if (!qRes.ok) return { date: null, quoteId };
  const qData = await qRes.json();
  return { date: parseDateFromHeader(qData.quote?.header), quoteId };
}

async function createCalendarEvent(eventDate, clientName, invoiceNumber) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary: `🎵 Prestation Myracoustic — ${clientName}`,
      description: `Facture ${invoiceNumber} — Acompte réglé. Date confirmée.`,
      start: { date: eventDate },
      end: { date: eventDate },
      status: 'confirmed',
      transparency: 'opaque',
    },
  });
}

export async function POST(request) {
  try {
    const payload = await request.json();

    // Ignorer tout ce qui n'est pas une facture client payée
    if (payload.type !== 'v1/client-invoices') {
      return NextResponse.json({ ok: true });
    }
    const evt = payload.data?.event;
    const status = payload.data?.status;
    if (evt !== 'updated' || status !== 'paid') {
      return NextResponse.json({ ok: true });
    }

    const invoiceId = payload.data?.id;
    const clientName = payload.data?.client_name || payload.data?.client?.name || 'Client';
    const invoiceNumber = payload.data?.number || invoiceId;

    const { date: eventDate, quoteId } = await getInvoiceDetails(invoiceId);

    // Mise à jour automatique du statut Supabase
    if (quoteId) {
      try {
        const { data: sbEvent } = await supabaseAdmin
          .from('events')
          .select('id, status')
          .eq('qonto_quote_id', quoteId)
          .maybeSingle();

        if (sbEvent) {
          // Acompte payé → confirme ; solde payé (déjà confirme) → termine
          const newStatus = sbEvent.status === 'confirme' ? 'termine' : 'confirme';
          await supabaseAdmin.from('events').update({ status: newStatus }).eq('id', sbEvent.id);
          console.log(`Statut événement mis à jour : ${sbEvent.status} → ${newStatus} (quote ${quoteId})`);
        }
      } catch (sbErr) {
        console.error('Supabase status update error:', sbErr.message);
      }
    }

    if (!eventDate) {
      console.log(`Facture ${invoiceNumber} payée — aucune date de prestation trouvée, agenda non mis à jour`);
      return NextResponse.json({ ok: true });
    }

    await createCalendarEvent(eventDate, clientName, invoiceNumber);
    console.log(`Agenda mis à jour : ${eventDate} — ${clientName}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Qonto webhook error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
