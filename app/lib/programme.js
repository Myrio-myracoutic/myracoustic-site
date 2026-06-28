/* Tri chronologique d'un programme d'événement, gérant le passage de minuit.

   Les horaires sont stockés en texte « HH:MM ». Un mariage / une soirée
   chevauche souvent deux jours (ex. 18:00 → 01:00). Un tri texte placerait
   « 01:00 » avant « 18:00 ». On considère donc les heures avant un seuil
   (ROLLOVER_HOUR, par défaut 06:00) comme appartenant au lendemain.

   Couvre les cas réels : événements de journée (toutes les heures ≥ 6, aucun
   décalage) comme soirées se terminant entre minuit et 6h du matin. */

export const ROLLOVER_HOUR = 6;

export function timeToSortKey(time) {
  if (!time) return 0;
  const [h, m] = String(time).split(':').map(n => parseInt(n, 10) || 0);
  let key = h * 60 + m;
  if (h < ROLLOVER_HOUR) key += 24 * 60; // après minuit = lendemain
  return key;
}

export function sortProgramme(items) {
  return [...(items || [])].sort((a, b) => timeToSortKey(a.time) - timeToSortKey(b.time));
}
