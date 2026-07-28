/* Réduction « du moment » sur une proposition de devis.
   Le montant en € est calculé à partir du type + de la valeur, borné à [0, total].
   La réduction n'est active que jusqu'à discount_until inclus (retour prix plein après). */

export function discountEuros(total, type, value) {
  if (!type || !value) return 0;
  const t = Number(total) || 0;
  const v = Number(value) || 0;
  const eur = type === 'percent' ? Math.round((t * v) / 100) : Math.round(v);
  return Math.max(0, Math.min(eur, t));
}

export function discountActive(discountUntil, now = new Date()) {
  if (!discountUntil) return false;
  const today = now.toISOString().slice(0, 10);
  return today <= discountUntil;
}

/* Libellé court de la réduction, ex. « −10 % » ou « −150 € ». */
export function discountLabel(type, value) {
  if (!type || !value) return '';
  return type === 'percent' ? `−${Number(value)} %` : `−${Number(value)} €`;
}
