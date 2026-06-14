export default function sitemap() {
  const base = 'https://myracoustic.com';
  const routes = [
    { path: '/', priority: 1, changeFrequency: 'monthly' },
    { path: '/evenement-entreprise', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/evenements-prives', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/cgv', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/politique-confidentialite', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
