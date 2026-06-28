/* Email de relance RSVP — partagé par le cron quotidien et le bouton « Relancer maintenant ». */

const SENDER = 'contact@myracoustic.com';

export async function sendRsvpReminderEmail({ toEmail, firstName, inviteLink, eventType, clientFirstName }) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 20px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 20px;line-height:1.3;">
      Avez-vous pensé à confirmer votre présence ?
    </h2>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#b8ef0b;">${clientFirstName}</strong> prépare son ${eventType || 'événement'} et attend votre réponse.
      Cela ne prend qu'un instant et l'aide beaucoup dans l'organisation.
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 32px;">
      Indiquez si vous serez présent(e) — et proposez vos chansons préférées — directement depuis votre invitation :
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Confirmer ma présence →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Ce lien est personnel et permanent — si vous avez déjà répondu, vous pouvez ignorer ce message.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 4px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:  { name: 'Myracoustic', email: SENDER },
      to:      [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER, name: 'Myracoustic' },
      subject: `Petit rappel — confirmez votre présence`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
}
