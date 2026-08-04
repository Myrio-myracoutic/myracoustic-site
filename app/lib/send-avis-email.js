/* Email "merci + avis" envoyé au passage du statut événement à 'termine'.
   Utilisé par le changement de statut (automatique) et par le bouton admin (relance manuelle).
   Simplifié le 2026-08-04 : un seul CTA d'avis (Google), Mariages.net en lien discret,
   invitation à recommander ajoutée, liens d'avis trackés via /api/track/avis. */

import { supabaseAdmin } from '@/app/lib/supabase-admin';

const SENDER = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function trackedAvisLink(eventId, type) {
  return `${APP_URL}/api/track/avis?eventId=${eventId}&type=${type}`;
}

function buildAvisEmail({ firstName, eventType, eventId }) {
  const isWedding = eventType?.toLowerCase().includes('mariage');
  const googleLink = trackedAvisLink(eventId, 'google');
  const mariagenetLink = trackedAvisLink(eventId, 'mariagenet');

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">Merci pour votre confiance</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 32px;">
      C'était un plaisir de sublimer votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong>.<br/>
      Nous espérons que cette journée a été inoubliable. Votre galerie photos est maintenant disponible dans votre espace.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${APP_URL}/mon-espace" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Voir ma galerie →</a>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0;border-top:1px solid rgba(255,255,255,0.07);padding-top:28px;">
      <tr><td>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.06em;">
          Votre avis nous aide à grandir
        </p>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 20px;line-height:1.6;">
          Si vous avez été satisfait(e) de notre prestation, un avis Google nous aide énormément à nous faire connaître. Cela ne prend qu'une minute !
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
          <tr><td style="background:#b8ef0b;border-radius:8px;padding:11px 22px;">
            <a href="${googleLink}" style="color:#060e16;font-size:14px;font-weight:700;text-decoration:none;">⭐ Laisser un avis Google</a>
          </td></tr>
        </table>
        ${isWedding ? `<p style="margin:0;"><a href="${mariagenetLink}" style="color:rgba(255,255,255,0.45);font-size:12.5px;text-decoration:underline;">Vous êtes aussi les bienvenus sur Mariages.net →</a></p>` : ''}
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0 0;border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;">
      <tr><td>
        <p style="color:rgba(255,255,255,0.5);font-size:13.5px;line-height:1.7;margin:0;">
          Vous connaissez un couple qui prépare son mariage, ou une occasion à célébrer ? Parlez-leur de nous — c'est le plus beau des compliments.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

export async function sendAvisEmail({ toEmail, firstName, eventType, eventId, billingEmail }) {
  const html = buildAvisEmail({ firstName, eventType, eventId });

  const isBillingStatus = billingEmail && billingEmail !== toEmail;
  const recipients = isBillingStatus ? [{ email: billingEmail }] : [{ email: toEmail, name: firstName }];
  const cc = isBillingStatus ? [{ email: toEmail, name: firstName }] : undefined;
  const subject = isBillingStatus
    ? '[Facturation] Merci pour votre confiance — retour sur votre événement'
    : 'Merci pour votre confiance — retour sur votre événement';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER },
      to: recipients,
      ...(cc ? { cc } : {}),
      replyTo: { email: SENDER, name: 'Myracoustic' },
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);

  if (eventId) {
    await supabaseAdmin.from('events').update({ avis_email_sent_at: new Date().toISOString() }).eq('id', eventId);
  }
}
