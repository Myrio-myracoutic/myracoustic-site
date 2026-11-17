// Demande d'un particulier (/devis/particulier, 17/11) : anniversaire, soirée privée, baptême…
// Décision de Myrio du 17/11 : même parcours que les mariages et les pros — demande, appel, puis
// proposition préparée par Myracoustic et signée sur la plateforme. Le devis instantané disparaît.
// Les demandes sont rangées avec celles des pros (table pro_contact_leads, structure
// « particulier ») : même fiche et même planning d'appel côté admin, onglet Particuliers.
// Libellés repris par l'admin de la plateforme
// (plateforme/app/admin/(authenticated)/leads/sectionConfig.js) : à garder synchro.

// Types d'événement déjà proposés aux particuliers par l'ancien tunnel.
export const TYPES_EVENEMENT = [
  'Anniversaire',
  'Soirée privée',
  'PACS',
  'EVJF / EVG',
  'Baptême',
  'Communion',
  'Fête familiale',
  'Autre',
];

// Ce que nous proposons aux particuliers (page /evenements-prives et grille tarifaire).
export const BESOINS_PARTICULIER = [
  'DJ et animation musicale',
  'Sonorisation',
  'Éclairage et mise en lumière',
  'Karaoké',
  'Vidéo et écrans',
  'À définir ensemble',
];
