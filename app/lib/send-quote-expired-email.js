/* Email envoyé quand Myrio marque un dossier "perdu" alors qu'un devis était en attente
   (status 'proposee') — prévient le client que sa date n'est plus retenue, sans fermer
   la porte : il peut recontacter pour une nouvelle proposition si la date est encore libre. */

const SENDER = 'contact@myracoustic.com';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

export async function sendQuoteExpiredEmail({ email, prenom, eventDate }) {
  const date = fmtDate(eventDate);
  const mailtoLink = `mailto:${SENDER}?subject=${encodeURIComponent('Réactiver mon devis Myracoustic')}`;

  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 16px;">Bonjour ${prenom || ''},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 24px;">
      Nous revenons vers vous : le devis que nous vous avions transmis${date ? ` pour votre mariage du <strong>${date}</strong>` : ''} est aujourd'hui expiré, et nous ne sommes malheureusement plus en mesure de vous garantir cette date.
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 24px;">
      Si votre projet tient toujours, pas d'inquiétude : il vous suffit de nous recontacter. Nous regarderons ensemble si la date est encore disponible et pourrons vous établir une nouvelle proposition.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${mailtoLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Nous recontacter →</a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;margin:0;">
      Vous pouvez aussi répondre directement à cet email ou nous appeler au 07 68 53 33 08.
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · ${SENDER} · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER },
      to: [{ email, name: prenom || undefined }],
      replyTo: { email: SENDER, name: 'Myracoustic' },
      subject: 'Votre devis Myracoustic n\'est plus valable',
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
}
