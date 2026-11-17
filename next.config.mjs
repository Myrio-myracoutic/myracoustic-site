const PLATEFORME = 'https://app.myracoustic.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Étape 4 du chantier particuliers (17/11) : les routes de l'ancien espace client, de l'ancien
  // admin et de l'ancien devis instantané ne répondent plus (410, voir app/api/ferme). Plus rien
  // ne les appelle : crons, webhook Qonto et pages publiques passent par d'autres routes (vérifié
  // le 17/11). `beforeFiles` : appliqué avant les routes encore présentes dans le code, qui
  // seront supprimées à l'étape 5.
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
      // site sont fermés, tout se passe sur la plateforme. Ces redirections passent avant les
      // pages (encore dans le code jusqu'au nettoyage de l'étape 5). Non permanentes : réversibles.
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
