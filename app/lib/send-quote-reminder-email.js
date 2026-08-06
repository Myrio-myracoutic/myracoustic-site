/* Email de rappel d'expiration d'un devis — 3 paliers honnêtes basés sur la vraie
   date d'expiration (jamais d'urgence inventée, cf. décision "raison d'agir
   honnête" du 06/08). Partagé entre le rappel mariage (run-devis-reminders.js,
   proposition en ligne) et le rappel particulier (run-particulier-devis-reminders.js,
   devis Qonto). */

const SENDER = 'contact@myracoustic.com';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

const TIERS = {
  j7: {
    subject: () => 'Votre devis Myracoustic — encore une semaine pour le valider',
    lead: (date) => `Votre proposition de devis est valable jusqu'au <strong>${date}</strong> — vous avez encore un peu de temps pour la consulter tranquillement et nous poser vos questions.`,
  },
  j3: {
    subject: () => 'Votre devis Myracoustic expire dans quelques jours',
    lead: (date) => `Votre proposition de devis expire dans quelques jours, le <strong>${date}</strong>. Passé cette date, les disponibilités et les tarifs peuvent évoluer.`,
  },
  j1: {
    // daysLeft peut valoir 0 (expire aujourd'hui, ex. devis à très courte validité ou
    // relance qui a manqué la veille) — jamais dire "demain" dans ce cas, ce serait faux.
    subject: (daysLeft) => daysLeft <= 0 ? 'Votre devis Myracoustic expire aujourd\'hui' : 'Votre devis Myracoustic expire demain',
    lead: (date, daysLeft) => daysLeft <= 0
      ? `Dernier rappel : votre proposition de devis expire <strong>aujourd'hui, le ${date}</strong>. Passé cette date, il faudra en refaire une — avec des disponibilités et des tarifs qui peuvent avoir changé.`
      : `Dernier rappel : votre proposition de devis expire <strong>demain, le ${date}</strong>. Passé cette date, il faudra en refaire une — avec des disponibilités et des tarifs qui peuvent avoir changé.`,
  },
};

export async function sendQuoteReminderEmail({ email, prenom, link, validUntil, urgency = 'j1', linkLabel = 'Voir et valider ma proposition →', daysLeft = 1 }) {
  const tier = TIERS[urgency] || TIERS.j1;
  const date = fmtDate(validUntil);

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
      ${tier.lead(date, daysLeft)}
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${link}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">${linkLabel}</a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;margin:0;">
      Une question ? Répondez à cet email ou appelez-nous au 07 68 53 33 08.
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
      sender: { name: 'Myracoustic', email: SENDER },
      to: [{ email, name: prenom || undefined }],
      replyTo: { email: SENDER, name: 'Myracoustic' },
      subject: tier.subject(daysLeft),
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
}

/* Palier honnête à partir du nombre de jours réels avant expiration (jamais
   négatif : un devis déjà expiré ne déclenche plus aucun rappel). */
export function urgencyForDaysLeft(daysLeft) {
  if (daysLeft <= 1) return 'j1';
  if (daysLeft <= 3) return 'j3';
  if (daysLeft <= 7) return 'j7';
  return null;
}

export function daysUntil(dateStr) {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00Z');
  return Math.round((target - today) / 86400000);
}
