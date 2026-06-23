import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';
const SENDER     = 'contact@myracoustic.com';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function normName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function fmtAmount(v) {
  return parseFloat(v?.value || v || 0);
}

function fmtEur(v) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

async function sendReminderEmail(toEmail, firstName, eventType, eventDate, amount, payUrl, ccEmail) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">
      Votre ${eventType || 'événement'}, c'est demain — nous sommes prêts !
    </h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 16px;">
      Tout est préparé pour faire de votre <strong style="color:#b8ef0b;">${fmtDate(eventDate)}</strong> un moment inoubliable. Nous avons hâte d'être là.
    </p>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 16px;">
      Avant de vous retrouver, une dernière formalité : votre <strong>facture de solde</strong> reste à régler.
      Vous avez jusqu'au jour J pour effectuer ce paiement — en avance ou sur place, comme vous le souhaitez.
    </p>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.8;margin:0 0 24px;font-style:italic;">
      Nous comprenons que certains préfèrent attendre de voir la prestation avant de solder. C'est tout à fait normal !
      Sachez simplement que le règlement peut s'effectuer à tout moment jusqu'à la fin de la soirée.
    </p>

    <!-- Montant -->
    <div style="background:rgba(184,239,11,0.06);border:1px solid rgba(184,239,11,0.2);border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px;">Montant à régler</p>
      <p style="color:#b8ef0b;font-size:28px;font-weight:800;margin:0;font-family:sans-serif;">${fmtEur(amount)}</p>
    </div>

    <!-- CTA paiement -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 36px;text-align:center;">
        <a href="${payUrl}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Régler ma facture →
        </a>
      </td></tr>
    </table>

    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0 0 8px;line-height:1.6;">
      Vous pouvez également accéder à votre facture depuis votre espace personnel :
    </p>
    <p style="margin:0;">
      <a href="${APP_URL}/mon-espace" style="color:#b8ef0b;font-size:13px;">
        ${APP_URL}/mon-espace
      </a>
    </p>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:      { name: 'Myracoustic', email: SENDER },
      to:          [{ email: toEmail }],
      ...(ccEmail && ccEmail !== toEmail ? { cc: [{ email: ccEmail, name: firstName }] } : {}),
      replyTo:     { email: SENDER, name: 'Myracoustic' },
      subject:     `Rappel paiement — votre ${eventType || 'événement'} est demain`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
}

export async function GET(request) {
  // Vérification du secret cron
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Date de demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Événements demain, non annulés, rappel pas encore envoyé, avec devis Qonto
  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('id, event_type, event_date, qonto_quote_id, status, billing_email, clients(first_name, last_name, email)')
    .eq('event_date', tomorrowStr)
    .not('status', 'eq', 'annule')
    .not('status', 'eq', 'termine')
    .is('payment_reminder_sent_at', null)
    .not('qonto_quote_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!events?.length) return NextResponse.json({ ok: true, sent: 0, message: 'Aucun événement demain' });

  // Récupérer toutes les factures Qonto une seule fois
  const invRes = await fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() });
  const allInvs = invRes.ok ? (await invRes.json()).client_invoices : [];

  const results = [];

  for (const ev of events) {
    const client = ev.clients;
    if (!client?.email) continue;

    const clientQonto = normName(`${client.first_name} ${client.last_name}`);
    const eventDateMs = new Date(ev.event_date).getTime();

    // Chercher la facture de solde liée à cet événement
    const balanceInv = allInvs.find(i => {
      if ((i.invoice_type || i.type) !== 'balance') return false;
      if (i.status === 'paid') return false;
      const invClient = normName(i.client_name);
      if (invClient !== clientQonto) return false;
      if (!i.due_date) return true;
      const dueDiff = Math.abs(new Date(i.due_date).getTime() - eventDateMs);
      return dueDiff <= 30 * 24 * 60 * 60 * 1000;
    });

    if (!balanceInv?.invoice_url) {
      results.push({ event: ev.id, status: 'skipped', reason: 'Pas de facture de solde non payée' });
      continue;
    }

    try {
      // Si billing_email défini : envoyer À billing + CC client principal
      const reminderTo = ev.billing_email || client.email;
      const reminderCc = ev.billing_email ? client.email : null;

      await sendReminderEmail(
        reminderTo,
        client.first_name,
        ev.event_type,
        ev.event_date,
        fmtAmount(balanceInv.total_amount),
        balanceInv.invoice_url,
        reminderCc,
      );

      await supabaseAdmin
        .from('events')
        .update({ payment_reminder_sent_at: new Date().toISOString() })
        .eq('id', ev.id);

      results.push({ event: ev.id, status: 'sent', to: client.email });
    } catch (e) {
      results.push({ event: ev.id, status: 'error', error: e.message });
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  return NextResponse.json({ ok: true, sent, results });
}
