/*
 * Date transmise dans l'adresse d'un formulaire de demande (?date=AAAA-MM-JJ), posée par le
 * bouton « Prendre rendez-vous » d'Aria après une date vérifiée libre (plateforme, /api/aria).
 * Renvoie la date seulement si elle est bien formée, réelle, et comprise entre `min` et `max`
 * (dates AAAA-MM-JJ, bornes incluses) ; sinon null, et le formulaire démarre normalement.
 */
export function lireDateAdresse(recherche, min, max) {
  const k = new URLSearchParams(recherche || '').get('date');
  if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return null;
  const d = new Date(`${k}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== k) return null; // ex. 2027-02-30
  if ((min && k < min) || (max && k > max)) return null;
  return k;
}

export function dateDepuisAdresse(min, max) {
  if (typeof window === 'undefined') return null;
  return lireDateAdresse(window.location.search, min, max);
}
