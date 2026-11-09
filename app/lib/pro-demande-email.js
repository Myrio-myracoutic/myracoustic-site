import { emailShell } from './send-call-confirm-email';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Confirmation envoyée au prospect pro juste après sa demande (api/contact/pro) : ton posé,
   récapitulatif de ce qu'il a indiqué, puis les étapes qui suivent. Une collectivité est prévenue
   que la proposition pourra passer par son circuit de validation interne. */
export function proDemandeConfirmationHtml({ prenom, societe, structure, type, date, personnes, lieu, besoins }) {
  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const recap = [
    ['Événement', type],
    ['Date envisagée', dateLabel],
    ['Effectif estimé', personnes],
    ['Lieu', lieu],
    ['Vos besoins', besoins.join(', ')],
  ].filter(([, v]) => v);
  const etapes = [
    'Un conseiller vous appelle sous 24 h ouvrées pour comprendre vos enjeux : le lieu, le déroulé, l’ambiance attendue.',
    structure === 'collectivite'
      ? 'Vous recevez une proposition sur mesure, détaillée et chiffrée en HT, à faire valider selon votre circuit interne.'
      : 'Vous recevez une proposition sur mesure, détaillée et chiffrée en HT.',
    'Le jour J, nous prenons en charge toute la technique, de l’installation au démontage.',
  ];

  return emailShell(`
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${esc(prenom)},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">Merci pour votre demande</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 28px;">
      Nous avons bien reçu votre demande pour <strong style="color:#b8ef0b;">${esc(societe)}</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 28px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
      <tr><td style="padding:18px 20px 6px;">
        <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">Votre demande</p>
      </td></tr>
      ${recap.map(([k, v]) => `<tr><td style="padding:0 20px 12px;">
        <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0 0 2px;">${k}</p>
        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0;">${esc(v)}</p>
      </td></tr>`).join('')}
      <tr><td style="padding:0 0 6px;"></td></tr>
    </table>

    <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px;">La suite</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 28px;">
      ${etapes.map((e, i) => `<tr>
        <td style="width:34px;vertical-align:top;padding:0 0 14px;">
          <div style="width:24px;height:24px;border-radius:12px;background:rgba(184,239,11,0.12);color:#b8ef0b;font-size:13px;font-weight:700;line-height:24px;text-align:center;">${i + 1}</div>
        </td>
        <td style="vertical-align:top;padding:2px 0 14px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;">${e}</td>
      </tr>`).join('')}
    </table>

    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.8;margin:0 0 24px;">
      Un plan de salle, un programme ou une question d’ici là ? Répondez simplement à cet email.
    </p>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0;">Bien cordialement,<br>L’équipe Myracoustic</p>
  `);
}
