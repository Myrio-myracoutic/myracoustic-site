// Calcul des 4 étapes du suivi post-signature (présentation, visite du lieu, point à 1 mois,
// derniers réglages), partagé entre la création automatique à l'ouverture de l'espace
// (app/api/admin/open-espace) et le rattrapage manuel pour un événement plus ancien
// (app/api/admin/event-milestones, createForEvent) — un seul endroit calcule ces dates.
function subtractFromDate(dateStr, { months = 0, days = 0 } = {}) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  if (months) d.setMonth(d.getMonth() - months);
  if (days) d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function buildMilestoneRows(eventDate) {
  return [
    { milestone_type: 'presentation', target_date: null },
    { milestone_type: 'visite_lieu', target_date: subtractFromDate(eventDate, { months: 6 }) },
    { milestone_type: 'point_1_mois', target_date: subtractFromDate(eventDate, { months: 1 }) },
    { milestone_type: 'reglages_2_semaines', target_date: subtractFromDate(eventDate, { days: 14 }) },
  ];
}
