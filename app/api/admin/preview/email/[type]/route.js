import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER     = 'contact@myracoustic.com';

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

// Templates des emails — doit rester synchronisé avec les routes d'envoi
function buildPaymentReminderHtml({ firstName, eventType, eventDate, amount, payUrl }) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">
      Votre ${eventType || 'événement'} c'est demain !
    </h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 24px;">
      Nous sommes ravis de vous accompagner <strong style="color:#b8ef0b;">${fmtDate(eventDate)}</strong>.<br/>
      Un dernier détail avant de profiter pleinement de votre journée :
      votre <strong>facture de solde</strong> est à régler.
    </p>

    <div style="background:rgba(184,239,11,0.06);border:1px solid rgba(184,239,11,0.2);border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px;">Montant à régler</p>
      <p style="color:#b8ef0b;font-size:28px;font-weight:800;margin:0;font-family:sans-serif;">${fmtEur(amount)}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 36px;text-align:center;">
        <a href="${payUrl}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Payer ma facture →
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
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · ${SENDER} · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

function buildStatusHtml({ firstName, status, eventType }) {
  const configs = {
    devis_envoye: { heading: 'Votre devis est disponible', body: `Nous avons préparé votre devis pour votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong>.<br/>Consultez-le et signez-le directement depuis votre espace personnel.`, cta: 'Voir mon devis →' },
    accepte:      { heading: 'Devis signé, merci !', body: `Votre devis a bien été enregistré.<br/>Votre espace personnel est maintenant entièrement actif : programme, playlists, invités…`, cta: 'Accéder à mon espace →' },
    confirme:     { heading: 'Réservation confirmée ✓', body: `Votre acompte a bien été reçu. Votre réservation pour votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong> est officielle.<br/>Vous pouvez construire votre programme, vos playlists et inviter vos proches.`, cta: 'Préparer mon événement →' },
    termine:      { heading: 'Merci pour votre confiance', body: `C'était un plaisir de sublimer votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong>.<br/>Nous espérons que cette journée a été inoubliable. Votre galerie photos est disponible dans votre espace.`, cta: 'Voir ma galerie →' },
    annule:       { heading: 'Annulation enregistrée', body: `Nous avons bien pris en compte l'annulation de votre réservation.<br/>N'hésitez pas à nous recontacter pour un futur projet.`, cta: null },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">${cfg.heading}</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 32px;">${cfg.body}</p>
    ${cfg.cta ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;"><tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;"><a href="${APP_URL}/mon-espace" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">${cfg.cta}</a></td></tr></table>` : ''}
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · ${SENDER} · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

// GET /api/admin/preview/email/[type]?eventId=xxx
// type: payment-reminder | devis_envoye | accepte | confirme | termine | annule
export async function GET(request, { params }) {
  if (!(await verifyAdminCookie())) {
    return new Response('Non autorisé', { status: 401 });
  }

  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  // Données par défaut (aperçu sans événement réel)
  let firstName = 'Marie';
  let eventType = 'Mariage';
  let eventDate = '2026-07-11';
  let amount    = 421.60;
  let payUrl    = 'https://pay.qonto.com/invoices/exemple';
  let status    = type;

  // Si eventId fourni, charger les vraies données
  if (eventId) {
    const { data: ev } = await supabaseAdmin
      .from('events')
      .select('event_type, event_date, qonto_quote_id, status, clients(first_name, last_name, email)')
      .eq('id', eventId)
      .single();

    if (ev) {
      firstName = ev.clients?.first_name || firstName;
      eventType = ev.event_type || eventType;
      eventDate = ev.event_date || eventDate;
      status    = ev.status || status;

      // Pour payment-reminder, chercher la vraie facture de solde
      if (type === 'payment-reminder' && ev.qonto_quote_id) {
        const invRes = await fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() });
        const allInvs = invRes.ok ? (await invRes.json()).client_invoices : [];
        const clientQonto = normName(`${ev.clients?.first_name} ${ev.clients?.last_name}`);
        const eventDateMs = new Date(ev.event_date).getTime();

        const balanceInv = allInvs.find(i => {
          if ((i.invoice_type || i.type) !== 'balance') return false;
          const invClient = normName(i.client_name);
          if (invClient !== clientQonto) return false;
          if (!i.due_date) return true;
          return Math.abs(new Date(i.due_date).getTime() - eventDateMs) <= 30 * 24 * 60 * 60 * 1000;
        });

        if (balanceInv) {
          amount = fmtAmount(balanceInv.total_amount);
          payUrl = balanceInv.invoice_url || payUrl;
        }
      }
    }
  }

  let html;
  if (type === 'payment-reminder') {
    html = buildPaymentReminderHtml({ firstName, eventType, eventDate, amount, payUrl });
  } else {
    html = buildStatusHtml({ firstName, status: type, eventType });
  }

  if (!html) {
    return new Response(`Type d'email inconnu : ${type}`, { status: 400 });
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
