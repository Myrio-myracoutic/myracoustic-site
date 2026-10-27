/* Échéancier de paiement d'une proposition de devis mariage.
   - deux_fois (historique) : 50 % à la signature, 50 % le jour J.
   - echelonne (test 27/10/2026) : 10 % à la signature (bloque la date), 40 % avant une date
     fixée par l'admin (second_payment_due), 50 % le jour J. */

export const PAYMENT_MODES = {
  deux_fois: 'Paiement en 2 fois',
  echelonne: 'Paiement échelonné',
};

export function paymentSchedule(total, mode) {
  const t = Number(total) || 0;
  if (mode === 'echelonne') {
    const first = Math.round(t * 0.1);
    const second = Math.round(t * 0.5) - first;
    return { first, second, solde: t - first - second };
  }
  const first = Math.round(t * 0.5);
  return { first, second: 0, solde: t - first };
}

function fmtDateFr(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Texte des conditions de paiement imprimé sur le devis Qonto. */
export function paymentTermsText(mode, secondDue) {
  if (mode === 'echelonne') {
    const due = secondDue ? `au plus tard le ${fmtDateFr(secondDue)}` : 'à la date convenue';
    return `Acompte de 10 % à la signature du devis (réservation de la date) — 2e acompte de 40 % ${due} — Solde de 50 % le jour de la prestation. Les sommes versées restent acquises en cas d'annulation par le client.`;
  }
  return 'Acompte de 50 % à la signature du devis — Solde de 50 % le jour de la prestation.';
}
