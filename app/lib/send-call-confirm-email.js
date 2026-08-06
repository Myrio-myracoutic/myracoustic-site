/* Emails autour du créneau d'appel — programmation, modification, annulation.
   Envoyés au moment de l'action (tunnel public ou admin, app/lib/call-booking.js
   et app/api/admin/mariage-leads). Best-effort partout : une panne d'envoi
   n'annule jamais l'action déjà actée en base. */

// "mardi 4 août 2026 à 9h15" (ou "9h" si l'heure tombe pile)
export function fmtSlotDateTime(date, time) {
  let dateLabel = date;
  try {
    dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { /* garde la date brute */ }
  const [h, m] = time.split(':');
  const heureLabel = m === '00' ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`;
  return `${dateLabel} à ${heureLabel}`;
}

function emailShell(bodyHtml) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">${bodyHtml}</td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

async function sendBrevoEmail({ toEmail, firstName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: 'contact@myracoustic.com' },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: 'contact@myracoustic.com', name: 'Myracoustic' },
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
}

/* Programmation ou modification d'un créneau — isReschedule adapte le titre/objet
   pour que le client comprenne que ça remplace un précédent horaire, pas un doublon. */
export async function sendCallConfirmEmail({ toEmail, firstName, tel, slotLabel, isReschedule = false, topic = 'de votre mariage' }) {
  const title = isReschedule ? 'Votre rendez-vous a été modifié 📞' : 'Votre appel est confirmé 📞';
  const subject = isReschedule ? `Votre rendez-vous est modifié — ${slotLabel}` : `Votre appel est confirmé — ${slotLabel}`;
  const html = emailShell(`
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">${title}</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
      <tr><td style="background:rgba(184,239,11,0.08);border:1px solid rgba(184,239,11,0.3);border-radius:8px;padding:16px 20px;">
        <p style="color:#b8ef0b;font-size:16px;font-weight:700;margin:0;text-transform:capitalize;">${slotLabel}</p>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0;">
      Un conseiller Myracoustic vous appellera au <strong>${tel}</strong> pour échanger ${topic}. Merci d'être disponible à ce moment-là.
    </p>
  `);
  await sendBrevoEmail({ toEmail, firstName, subject, html });
}

/* Annulation d'un rendez-vous, sans nouveau créneau proposé dans l'immédiat. */
export async function sendCallCancelEmail({ toEmail, firstName }) {
  const html = emailShell(`
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 20px;line-height:1.3;">Votre rendez-vous téléphonique a été annulé</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0;">
      Nous reviendrons vers vous prochainement pour convenir d'un nouveau moment. Si vous avez une préférence de jour ou d'horaire, répondez simplement à cet email.
    </p>
  `);
  await sendBrevoEmail({ toEmail, firstName, subject: 'Votre rendez-vous téléphonique a été annulé', html });
}
