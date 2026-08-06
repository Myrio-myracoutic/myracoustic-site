import { SEQUENCE_EMAILS } from './lead-magnet-sequence-data';

const SENDER_EMAIL = 'contact@myracoustic.com';
const CONTACT_URL = 'https://myracoustic.com/devis/mariage-contact';

/* Envoie l'email n°`step` (1 à 5) de la séquence de relance à un contact ayant
   téléchargé le guide DJ mariage. `id` sert de jeton de désinscription — pas de
   compte à créer, juste l'id de la ligne lead_magnet_signups. */
export async function sendLeadMagnetSequenceEmail({ toEmail, firstName, step, id }) {
  const content = SEQUENCE_EMAILS[step - 1];
  if (!content) throw new Error(`Étape de séquence invalide : ${step}`);

  const prenom = firstName || '';
  const unsubscribeUrl = `https://myracoustic.com/api/lead-magnet/unsubscribe?id=${id}`;

  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 20px;">Bonjour${prenom ? ` ${prenom}` : ''},</p>

    <h2 style="color:#ffffff;font-size:19px;font-weight:700;margin:0 0 20px;line-height:1.3;">${content.title}</h2>

    ${content.body.map(p => `<p style="color:rgba(255,255,255,0.8);font-size:14.5px;line-height:1.8;margin:0 0 16px;">${p}</p>`).join('')}

    <table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:13px 30px;text-align:center;">
        <a href="${CONTACT_URL}" style="color:#060e16;font-size:14.5px;font-weight:700;text-decoration:none;">
          Parler de mon projet →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0 0 10px;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
    <p style="color:rgba(255,255,255,0.18);font-size:10.5px;margin:0;">
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Ne plus recevoir ces emails</a>
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER_EMAIL },
      to: [{ email: toEmail, name: prenom || undefined }],
      replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
      subject: content.subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
}
