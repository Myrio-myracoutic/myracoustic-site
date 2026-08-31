/* Lecture côté formulaire de l'attribution posée par AttributionCapture.js (gclid/utm_*,
   premier contact publicitaire capté). Rien d'inventé : tout est null si jamais rien n'a été
   capté (visiteur direct, organique, ou navigation privée). */
export function readAttribution() {
  try {
    const raw = window.localStorage.getItem('myr_attribution');
    if (!raw) return { gclid: null, utm_source: null, utm_medium: null, utm_campaign: null };
    const a = JSON.parse(raw);
    return {
      gclid: a.gclid || null,
      utm_source: a.utm_source || null,
      utm_medium: a.utm_medium || null,
      utm_campaign: a.utm_campaign || null,
    };
  } catch {
    return { gclid: null, utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

export const SOURCE_OPTIONS = [
  { value: 'recherche_google', label: 'Recherche Google' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'bouche_a_oreille', label: 'Bouche-à-oreille / recommandation' },
  { value: 'salon_du_mariage', label: 'Salon du mariage' },
  { value: 'bark', label: 'Bark.com' },
  { value: 'mariages_net', label: 'Mariages.net' },
  { value: 'autre', label: 'Autre' },
];

export const SOURCE_OPTIONS_PRO = SOURCE_OPTIONS.filter(o => o.value !== 'salon_du_mariage' && o.value !== 'mariages_net');
