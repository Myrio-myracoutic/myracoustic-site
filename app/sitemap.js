/* Plan du site envoyé à Google.
   `modifie` = date de la dernière modification RÉELLE du contenu de la page (texte, sections,
   mise en page). À mettre à jour dans le même commit que tout changement de ce genre.
   Ne pas la changer pour une image allégée, une retouche du pied de page ou du code invisible.
   Pourquoi : avant le 19/11, toutes les pages prenaient la date de la mise en ligne ; Google
   ignore les dates d'un sitemap quand elles changent toutes à chaque fois. */
export default function sitemap() {
  const base = 'https://myracoustic.com';
  const routes = [
    { path: '/',                           modifie: '2026-11-18', priority: 1,   changeFrequency: 'monthly' },
    { path: '/evenement-entreprise',       modifie: '2026-11-11', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/evenements-prives',          modifie: '2026-11-20', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/mariage',                    modifie: '2026-11-19', priority: 0.9, changeFrequency: 'monthly' },
    // Portes d'entrée mariage (mariage-sans-stress/portes.js) : pages indexées.
    { path: '/organisation-mariage',       modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/guide-dj-mariage',           modifie: '2026-11-19', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/sonorisation-nantes',        modifie: '2026-11-18', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sonorisation-angers',        modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sonorisation-saint-nazaire', modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sonorisation-rennes',        modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/dj-mariage-nantes',          modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/dj-mariage-angers',          modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/dj-mariage-saint-nazaire',   modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/dj-mariage-rennes',          modifie: '2026-11-19', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/cgv',                        modifie: '2026-10-27', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/mentions-legales',           modifie: '2026-06-07', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/politique-confidentialite',  modifie: '2026-11-14', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: route.modifie,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
