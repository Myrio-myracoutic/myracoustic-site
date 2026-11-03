/* Règles de validité du devis selon la proximité de l'événement.
   (Cahier des charges : < 3 mois → 3 j · < 6 mois → 1 sem · > 6 mois → 2 sem) */

function addDays(from, n) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
}

export function validityDays(eventDate, from = new Date()) {
  if (!eventDate) return 14;
  const ev = new Date(eventDate + 'T12:00:00');
  const threeM = new Date(from); threeM.setMonth(threeM.getMonth() + 3);
  const sixM = new Date(from); sixM.setMonth(sixM.getMonth() + 6);
  if (ev < threeM) return 3;
  if (ev < sixM) return 7;
  return 14;
}

/* Date limite (YYYY-MM-DD) jusqu'à laquelle l'offre est valable. */
export function validUntil(eventDate, from = new Date()) {
  return addDays(from, validityDays(eventDate, from)).toISOString().slice(0, 10);
}

/* Une proposition refusée (marquée perdue en admin) ou expirée (délai de validité dépassé, jamais
   validée) ne doit plus pouvoir être acceptée par le client — ni affichée comme si de rien n'était. */
export function proposalUnavailable(p) {
  if (p.status === 'refusee') return 'refusee';
  if (p.status === 'proposee' && p.valid_until && p.valid_until < new Date().toISOString().slice(0, 10)) return 'expiree';
  return null;
}
