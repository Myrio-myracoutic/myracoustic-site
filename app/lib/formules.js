/* Source de vérité des formules mariage — repricing validé 2026-10-15 (voir history.md).
   Les clés internes (essentiel/signature/prestige) restent inchangées pour ne pas casser le
   déverrouillage de fonctionnalités dans l'espace client (mon-espace/page.js, basé sur `events.formule`)
   ni les propositions déjà envoyées (devis_proposals.formule) — seuls noms, prix et contenus changent.
   Prix TTC, affichés « à partir de ». Mariage côté particulier uniquement. */

/* Pôles affichés sur les cartes (ordre + libellé). L'icône est mappée côté composant. */
export const POLES = [
  { key: 'dj',        label: 'DJ' },
  { key: 'son',       label: 'Sonorisation' },
  { key: 'lumiere',   label: 'Éclairage' },
  { key: 'video',     label: 'Vidéo' },
  { key: 'effets',    label: 'Effets spéciaux' },
  { key: 'photobooth', label: 'Photobooth' },
  { key: 'livre_or',  label: 'Livre d’or vidéo & audio' },
  { key: 'captation', label: 'Captures vidéo' },
  { key: 'ceremonie', label: 'Cérémonie & vin d’honneur' },
  { key: 'jourJ',     label: 'Le jour J' },
];

export const FORMULES = [
  {
    key: 'essentiel',
    name: 'Ambiance Festive',
    price: 2000,
    featured: false,
    accroche: 'Pour une célébration pleine de joie et de rythme, sans le superflu.',
    specs: {
      dj: '6h · heures supplémentaires en option',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste de danse',
      video: 'Vidéoprojecteur inclus',
      effets: 'Fumée lourde et étincelles froides incluses',
      captation: 'Captation de la soirée (durée de présence du DJ)',
      ceremonie: 'En option (cérémonie laïque, vin d’honneur)',
      jourJ: 'Installation & technicien inclus',
    },
    platform: 'Accès basique : playlists collaboratives + programmation musicale du déroulé',
    options: [
      { key: 'karaoke',       label: 'Karaoké & blind test',          price: 100, category: 'animation' },
      { key: 'ceremonie',     label: 'Sonorisation cérémonie laïque', price: 190, category: 'sonorisation' },
      { key: 'vin',           label: 'Sonorisation vin d’honneur',    price: 120, category: 'sonorisation' },
      { key: 'reception',     label: 'Grande réception (150-300 pers.)', price: 150, category: 'sonorisation' },
      { key: 'lumiere_salle', label: 'Mise en lumière de la salle',   price: 50,  category: 'eclairage' },
      { key: 'murled2',       label: 'Mur LED 2 m²',                  price: 300, category: 'video' },
      { key: 'murled4',       label: 'Mur LED 4 m²',                  price: 600, category: 'video' },
      { key: 'photobooth',    label: 'Photobooth',                    price: 450, category: 'animation' },
      { key: 'livre_or',      label: 'Livre d’or vidéo & audio',      price: 150, category: 'animation' },
    ],
    // Pour le bouton "Personnaliser cette formule" du DevisBuilder admin : ce qui est inclus
    // de base, à cocher automatiquement en basculant vers un Pack personnalisé (décochable).
    packPreset: {
      base: ['dj', 'son', 'lumiere_piste', 'videoproj', 'fumee', 'etincelles', 'installation', 'captation', 'espace_en_ligne'],
      options: [],
    },
  },
  {
    key: 'signature',
    name: 'Expérience Signature',
    price: 3000,
    featured: true,
    badge: 'Le plus choisi',
    accroche: 'L’expérience complète pour une soirée orchestrée avec élégance, sans limite.',
    specs: {
      dj: 'Soirée complète, sans limite d’heures',
      son: 'Adaptée au nombre d’invités',
      lumiere: 'Piste de danse + mise en lumière de la salle',
      video: 'Mur LED 2 m² inclus',
      effets: 'Fumée lourde et étincelles froides incluses',
      photobooth: 'Inclus',
      livre_or: 'Inclus',
      captation: 'Captation de l’intégralité de l’événement, film souvenir offert + fichiers bruts partagés',
      ceremonie: 'Vin d’honneur inclus',
      jourJ: 'Installation & technicien dédié, accompagnement prioritaire',
    },
    platform: 'Accès complet : invités & RSVP, menu, plan de table, faire-part + infos pratiques, accès collaborateurs',
    options: [
      { key: 'karaoke',     label: 'Karaoké & blind test',          price: 100, category: 'animation' },
      { key: 'ceremonie',   label: 'Sonorisation cérémonie laïque', price: 190, category: 'sonorisation' },
      { key: 'reception',   label: 'Grande réception (150-300 pers.)', price: 150, category: 'sonorisation' },
      { key: 'murled4',     label: 'Upgrade Mur LED 4 m²',          price: 300, category: 'video' },
    ],
    packPreset: {
      base: ['dj', 'son', 'lumiere_piste', 'fumee', 'etincelles', 'installation', 'captation', 'espace_en_ligne'],
      options: ['murled2', 'photobooth', 'livre_or', 'vin'],
    },
  },
  {
    key: 'prestige',
    name: 'Mariage d’Exception',
    price: 4000,
    featured: false,
    accroche: 'Le summum du sur-mesure, pour un mariage grandiose et totalement unique.',
    specs: {
      dj: 'Prestation illimitée en temps',
      son: 'Sonorisation multi-espace complète',
      lumiere: 'Mise en lumière complète',
      video: 'Mur LED sur-mesure',
      effets: 'Fumée lourde + étincelles froides incluses',
      photobooth: 'Inclus',
      livre_or: 'Inclus',
      captation: 'Captation sur-mesure de l’intégralité de l’événement, film souvenir offert + fichiers bruts partagés',
      ceremonie: 'Toute cérémonie (laïque, religieuse, symbolique) + vin d’honneur inclus',
      jourJ: 'Installation + équipe dédiée, suivi en temps réel et communication prioritaire',
    },
    platform: 'Accès Premium : + moments forts son & lumière, playlists surprises, coordination du déroulé, accompagnement personnalisé par un interlocuteur unique, gestion proactive des imprévus',
    options: [
      { key: 'karaoke',  label: 'Karaoké & blind test',     price: 100, category: 'animation' },
    ],
    packPreset: {
      base: ['dj', 'son', 'lumiere_piste', 'fumee', 'etincelles', 'installation', 'captation', 'espace_en_ligne'],
      options: ['photobooth', 'livre_or', 'vin', 'ceremonie'],
    },
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

export const EXTRA_HOUR_PRICE = 70; // heure DJ supplémentaire (TTC) — sauf Signature et Prestige (soirée complète / illimitée)

/* Catalogue complet des options (dédupliquées par clé, union des 3 formules) — pour le "Pack
   personnalisé" du DevisBuilder admin, où les options sont de simples inclusions sans prix propre
   (le prix du pack est fixé librement par l'admin, indépendamment des options cochées). */
export const ALL_OPTIONS = (() => {
  const seen = new Map();
  for (const f of FORMULES) for (const o of f.options) if (!seen.has(o.key)) seen.set(o.key, o);
  return [...seen.values()];
})();

/* Éléments de base (normalement garantis par une formule via `specs`, donc absents de `options`)
   — à cocher manuellement pour un pack personnalisé, qui n'a aucune formule derrière lui. */
export const PACK_BASE_ITEMS = [
  { key: 'dj',             label: 'DJ' },
  { key: 'son',            label: 'Sonorisation' },
  { key: 'lumiere_piste',  label: 'Éclairage piste de danse' },
  { key: 'videoproj',      label: 'Vidéoprojecteur' },
  { key: 'fumee',          label: 'Fumée lourde' },
  { key: 'etincelles',     label: 'Étincelles froides' },
  { key: 'installation',   label: 'Installation / désinstallation' },
  { key: 'captation',      label: 'Captures vidéo professionnelles' },
  { key: 'espace_en_ligne', label: 'Espace en ligne' },
];

export const fmtPrice = (n) => n.toLocaleString('fr-FR') + ' €';

/* Détail des inclusions d'une formule, en puces — pour la description d'une ligne de devis Qonto.
   Filtre les mentions « en option » ; la cérémonie n'affiche que ce qui est réellement inclus.
   Prend l'objet formule directement (et pas seulement sa clé) pour pouvoir aussi bien décrire une
   formule courante (FORMULES) qu'une formule figée (devis_proposals.formule_snapshot) — voir
   PropositionTokenClient.js. */
export function formuleInclusionsTextFromObj(f) {
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

export function formuleInclusionsText(key) {
  return formuleInclusionsTextFromObj(FORMULES.find(x => x.key === key));
}
