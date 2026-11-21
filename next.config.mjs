const PLATEFORME = 'https://app.myracoustic.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Étape 4 du chantier particuliers (17/11) : les routes de l'ancien espace client, de l'ancien
  // admin et de l'ancien devis instantané répondent « fermé » (410, voir app/api/ferme). Leur code
  // a été supprimé à l'étape 5 (21/11) ; ces règles restent pour qu'un ancien appel reçoive un
  // message clair plutôt qu'une page introuvable. `/api/qonto/devis` est encore appelé par l'ancien
  // calculateur de DevisFlow.js, que plus aucune page n'affiche.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/api/admin/:path*', destination: '/api/ferme' },
        { source: '/api/mon-espace/:path*', destination: '/api/ferme' },
        { source: '/api/qonto/devis', destination: '/api/ferme' },
      ],
    };
  },
  async redirects() {
    return [
      // Étape 4 du chantier particuliers (17/11) : l'ancien espace client et l'ancien admin du
      // site sont fermés (code supprimé le 21/11), tout se passe sur la plateforme. Ces
      // redirections gardent vivants les liens des anciens e-mails et favoris. Non permanentes.
      { source: '/mon-espace/mot-de-passe-oublie', destination: `${PLATEFORME}/connexion/mot-de-passe-oublie`, permanent: false },
      { source: '/mon-espace/:path*', destination: `${PLATEFORME}/connexion?bascule=1`, permanent: false },
      { source: '/auth/callback', destination: `${PLATEFORME}/connexion?bascule=1`, permanent: false },
      { source: '/admin/:path*', destination: `${PLATEFORME}/admin`, permanent: false },
      { source: '/particuliers', destination: '/evenements-prives', permanent: true },
      { source: '/particuliers/devis', destination: '/devis/particulier', permanent: true },
      { source: '/evenements-prives/devis', destination: '/devis/particulier', permanent: true },
      { source: '/contact/devis-particulier', destination: '/devis/particulier', permanent: true },
      { source: '/contact/devis-entreprise', destination: '/devis/professionnel', permanent: true },
      { source: '/entreprises', destination: '/evenement-entreprise', permanent: true },
      { source: '/conditions-generales-de-vente', destination: '/cgv', permanent: true },
      { source: '/politique-de-confidentialite', destination: '/politique-confidentialite', permanent: true },
      { source: '/contact', destination: '/devis/particulier', permanent: true },
      // Pages de l'ancien site WordPress encore connues de Bing (IndexNow Rank Math, 19/11) : 404 sinon.
      { source: '/prestations', destination: '/', permanent: true },
      { source: '/actualites', destination: '/', permanent: true },
      { source: '/le-mag-myracoustic', destination: '/guide-dj-mariage', permanent: true },
      // Ancien tunnel formules mariage (obsolète, remplacé par le modèle lead → appel) → page mariage
      { source: '/devis/mariage', destination: '/mariage', permanent: true },
      { source: '/devis/mariage/:formule', destination: '/mariage', permanent: true },
      // Depuis le 03/11, toutes les signatures se font sur la plateforme : anciens liens de
      // proposition (emails déjà envoyés, relances du cron devis-reminder) → même proposition
      // là-bas (table devis_proposals partagée). Temporaire (non permanent) : réversible.
      { source: '/proposition/:token', destination: `${PLATEFORME}/proposition/:token`, permanent: false },
    ];
  },
};

export default nextConfig;
