/* Source de vérité des formules mariage — spec validée 2026-06-29.
   Voir history.md (Session 2026-06-29) et la mémoire project-formules-mariage.
   Prix TTC, affichés « à partir de ». Mariage côté particulier uniquement. */

/* Pôles affichés sur les cartes (ordre + libellé). L'icône est mappée côté composant. */
export const POLES = [
  { key: 'dj',        label: 'DJ' },
  { key: 'son',       label: 'Sonorisation' },
  { key: 'lumiere',   label: 'Éclairage' },
  { key: 'video',     label: 'Vidéo' },
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
      dj: '5h',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste de danse',
      video: null,
      ceremonie: 'En option (cérémonie laïque, vin d’honneur)',
      jourJ: 'Installation & technicien inclus',
    },
    platform: 'Playlists collaboratives + programmation musicale du déroulé',
    options: [
      { key: 'ceremonie',     label: 'Sonorisation cérémonie laïque', price: 190 },
      { key: 'vin',           label: 'Sonorisation vin d’honneur',    price: 120 },
      { key: 'lumiere_salle', label: 'Mise en lumière de la salle', price: 50 },
      { key: 'fumee',         label: 'Machine à fumée lourde',       price: 50 },
      { key: 'etincelles',    label: 'Machines à étincelles froides', price: 100 },
      { key: 'videoproj',     label: 'Vidéoprojecteur / diaporama',  price: 50 },
      { key: 'murled2',       label: 'Mur LED 2 m²',                 price: 300 },
      { key: 'murled4',       label: 'Mur LED 4 m²',                 price: 600 },
      { key: 'karaoke',       label: 'Karaoké & blind test',         price: 100 },
      { key: 'reception',     label: 'Grande réception (150-300 pers.)', price: 150 },
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
      dj: '7h',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste + mise en lumière de la salle',
      video: 'Vidéoprojecteur / diaporama inclus',
      ceremonie: 'Vin d’honneur inclus · cérémonie laïque en option',
      jourJ: 'Installation & technicien inclus',
    },
    platform: 'Plateforme complète : invités & RSVP, menu, plan de table, faire-part + infos pratiques, accès collaborateurs',
    options: [
      { key: 'ceremonie',   label: 'Sonorisation cérémonie laïque', price: 190 },
      { key: 'fumee',       label: 'Machine à fumée lourde',        price: 50 },
      { key: 'etincelles',  label: 'Machines à étincelles froides', price: 100 },
      { key: 'murled2',     label: 'Mur LED 2 m²',                  price: 300 },
      { key: 'murled4',     label: 'Mur LED 4 m²',                  price: 600 },
      { key: 'karaoke',     label: 'Karaoké & blind test',          price: 100 },
      { key: 'reception',   label: 'Grande réception (150-300 pers.)', price: 150 },
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
      lumiere: 'Complet + étincelles + fumée lourde inclus',
      video: 'Mur LED 2 m² inclus',
      ceremonie: 'Cérémonie laïque + vin d’honneur inclus',
      jourJ: 'Installation + technicien dédié',
    },
    platform: '+ Moments forts son & lumière, playlists surprises, coordination du déroulé, accompagnement prioritaire',
    options: [
      { key: 'karaoke',  label: 'Karaoké & blind test',     price: 100 },
      { key: 'murled4',  label: 'Upgrade Mur LED 4 m²',     price: 300 },
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
