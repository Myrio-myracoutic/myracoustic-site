/* Référentiel partagé des « moments forts » son + lumière du programme.
   Utilisé par l'éditeur couple, le PDF prestataire et la vue admin → libellés cohérents partout. */

export const LIGHT_MOODS = [
  { value: 'tamisee',     label: 'Tamisée / intime' },
  { value: 'chaleureuse', label: 'Chaleureuse / dorée' },
  { value: 'coloree',     label: 'Colorée / dynamique' },
  { value: 'spot',        label: 'Spot sur les mariés' },
  { value: 'pleine',      label: 'Pleine lumière' },
];

export const EFFECTS = [
  { value: 'fumee',        label: 'Machine à fumée' },
  { value: 'fumee_lourde', label: 'Fumée lourde (au sol)' },
  { value: 'etincelles',   label: 'Étincelles froides' },
  { value: 'confettis',    label: 'Confettis' },
];

export const moodLabel   = (v) => LIGHT_MOODS.find(m => m.value === v)?.label || '';
export const effectLabel = (v) => EFFECTS.find(e => e.value === v)?.label || v;

/* Un moment fort a-t-il du contenu son+lumière à montrer ? */
export function hasHighlightContent(item) {
  return !!(item?.light_mood || (item?.effects && item.effects.length) || (item?.ambiance_note || '').trim());
}
