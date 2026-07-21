/* Source de vérité des formules mariage — spec validée 2026-06-29.
   Voir history.md (Session 2026-06-29) et la mémoire project-formules-mariage.
   Prix TTC, affichés « à partir de ». Mariage côté particulier uniquement. */

/* Pôles affichés sur les cartes (ordre + libellé). L'icône est mappée côté composant. */
export const POLES = [
  { key: 'dj',        label: 'DJ' },
  { key: 'son',       label: 'Sonorisation' },
  { key: 'lumiere',   label: 'Éclairage' },
  { key: 'video',     label: 'Vidéo' },
  { key: 'effets',    label: 'Effets spéciaux' },
  { key: 'ceremonie', label: 'Cérémonie & vin d’honneur' },
  { key: 'jourJ',     label: 'Le jour J' },
];

export const FORMULES = [
  {
    key: 'essentiel',
    name: 'Essentiel',
    price: 990,
    featured: false,
    accroche: 'Une belle soirée dansante, faite avec exigence.',
    specs: {
      dj: '4h · heures supplémentaires en option',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste de danse',
      video: null,
      effets: 'En option (fumée lourde, étincelles froides)',
      ceremonie: 'En option (cérémonie laïque, vin d’honneur)',
      jourJ: 'Installation & technicien inclus',
    },
    platform: 'Playlists collaboratives + programmation musicale du déroulé',
    options: [
      { key: 'karaoke',       label: 'Karaoké & blind test',          price: 100, category: 'animation' },
      { key: 'ceremonie',     label: 'Sonorisation cérémonie laïque', price: 190, category: 'sonorisation' },
      { key: 'vin',           label: 'Sonorisation vin d’honneur',    price: 120, category: 'sonorisation' },
      { key: 'reception',     label: 'Grande réception (150-300 pers.)', price: 150, category: 'sonorisation' },
      { key: 'lumiere_salle', label: 'Mise en lumière de la salle',   price: 50,  category: 'eclairage' },
      { key: 'videoproj',     label: 'Vidéoprojecteur / diaporama',   price: 50,  category: 'video' },
      { key: 'murled2',       label: 'Mur LED 2 m²',                  price: 300, category: 'video' },
      { key: 'murled4',       label: 'Mur LED 4 m²',                  price: 600, category: 'video' },
      { key: 'fumee',         label: 'Machine à fumée lourde',        price: 50,  category: 'effets', note: 'Danse dans les nuages — effet mariés' },
      { key: 'etincelles',    label: 'Machines à étincelles froides', price: 100, category: 'effets', note: 'Lot de 2 machines' },
    ],
  },
  {
    key: 'signature',
    name: 'Signature',
    price: 1490,
    featured: true,
    badge: 'Le plus choisi',
    accroche: 'Votre soirée, jusque dans ses moindres émotions.',
    specs: {
      dj: '6h · heures supplémentaires en option',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste + mise en lumière de la salle',
      video: 'Vidéoprojecteur / diaporama inclus',
      effets: 'Fumée lourde incluse · étincelles en option',
      ceremonie: 'Vin d’honneur inclus · cérémonie laïque en option',
      jourJ: 'Installation & technicien inclus',
    },
    platform: 'Plateforme complète : invités & RSVP, menu, plan de table, faire-part + infos pratiques, accès collaborateurs',
    options: [
      { key: 'karaoke',     label: 'Karaoké & blind test',          price: 100, category: 'animation' },
      { key: 'ceremonie',   label: 'Sonorisation cérémonie laïque', price: 190, category: 'sonorisation' },
      { key: 'reception',   label: 'Grande réception (150-300 pers.)', price: 150, category: 'sonorisation' },
      { key: 'murled2',     label: 'Mur LED 2 m²',                  price: 300, category: 'video' },
      { key: 'murled4',     label: 'Mur LED 4 m²',                  price: 600, category: 'video' },
      { key: 'etincelles',  label: 'Machines à étincelles froides', price: 100, category: 'effets', note: 'Lot de 2 machines' },
    ],
  },
  {
    key: 'prestige',
    name: 'Prestige',
    price: 2490,
    featured: false,
    accroche: 'Votre journée entière, orchestrée.',
    specs: {
      dj: 'Soirée complète',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Mise en lumière complète',
      video: 'Mur LED 2 m² inclus',
      effets: 'Fumée lourde + étincelles froides incluses',
      ceremonie: 'Cérémonie laïque + vin d’honneur inclus',
      jourJ: 'Installation + technicien dédié',
    },
    platform: '+ Moments forts son & lumière, playlists surprises, coordination du déroulé, accompagnement prioritaire',
    options: [
      { key: 'karaoke',  label: 'Karaoké & blind test',     price: 100, category: 'animation' },
      { key: 'murled4',  label: 'Upgrade Mur LED 4 m²',     price: 300, category: 'video' },
    ],
  },
];

export const FORMULES_CHAPEAU =
  'Son, lumière, vidéo et DJ réunis par une seule équipe — pour que rien, le jour J, ne soit laissé au hasard.';

export const PLATFORM_PITCH = {
  title: 'Votre QG de mariage en ligne',
  subtitle: 'Tout gérer, à deux, au même endroit.',
};

/* Matrice d'accès plateforme par formule — vitrine + futur blocage in-app (events.formule). */
export const PLATFORM_FEATURES = [
  { label: 'Playlists & programmation musicale', essentiel: true,  signature: true,  prestige: true },
  { label: 'Vue d’ensemble & contact',           essentiel: true,  signature: true,  prestige: true },
  { label: 'Checklist de préparation',            essentiel: true,  signature: true,  prestige: true },
  { label: 'Galerie photos post-événement',       essentiel: true,  signature: true,  prestige: true },
  { label: 'Invités & RSVP (+ relances)',         essentiel: false, signature: true,  prestige: true },
  { label: 'Choix du menu par les invités',       essentiel: false, signature: true,  prestige: true },
  { label: 'Plan de table',                       essentiel: false, signature: true,  prestige: true },
  { label: 'Faire-part + infos pratiques',        essentiel: false, signature: true,  prestige: true },
  { label: 'Accès témoins / proches',             essentiel: false, signature: true,  prestige: true },
  { label: 'Moments forts son & lumière',         essentiel: false, signature: false, prestige: true },
  { label: 'Playlists surprises',                 essentiel: false, signature: false, prestige: true },
  { label: 'Coordination du déroulé',             essentiel: false, signature: false, prestige: true },
];

export const EXTRA_HOUR_PRICE = 70; // heure DJ supplémentaire (TTC) — sauf Prestige (soirée complète)

export const fmtPrice = (n) => n.toLocaleString('fr-FR') + ' €';

/* Détail des inclusions d'une formule, en puces — pour la description d'une ligne de devis Qonto.
   Filtre les mentions « en option » ; la cérémonie n'affiche que ce qui est réellement inclus. */
export function formuleInclusionsText(key) {
  const f = FORMULES.find(x => x.key === key);
  if (!f) return '';
  const strip = (s) => s.split('·').map(x => x.trim()).filter(x => x && !/en option/i.test(x)).join(' · ');
  const lines = POLES
    .map(p => {
      const raw = f.specs[p.key];
      if (!raw || /^en option/i.test(raw)) return null;
      const val = strip(raw);
      if (!val) return null;
      return p.key === 'ceremonie' ? val : `${p.label} : ${val}`;
    })
    .filter(Boolean);
  if (f.platform) lines.push(`Espace en ligne : ${f.platform}`);
  return lines.map(l => `• ${l}`).join('\n');
}
