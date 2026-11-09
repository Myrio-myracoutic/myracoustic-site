// Demande pro (/devis/professionnel) : type de structure et besoins cochés, enregistrés dans
// pro_contact_leads (structure, besoins). Le type de structure décidera de l'accord (signature en
// ligne, ou validation interne pour une collectivité). Libellés repris par l'admin de la plateforme
// (plateforme/app/admin/(authenticated)/leads/sectionConfig.js) : à garder synchro.
export const STRUCTURES = [
  { value: 'entreprise', label: 'Une entreprise' },
  { value: 'collectivite', label: 'Une collectivité' },
  { value: 'association', label: 'Une association' },
];

export const BESOINS_PRO = [
  'Sonorisation',
  'Micros pour les prises de parole',
  'Éclairage et mise en lumière',
  'DJ et animation musicale',
  'Karaoké',
  'Vidéo (vidéoprojecteur, mur LED)',
  'À définir avec un conseiller',
];
