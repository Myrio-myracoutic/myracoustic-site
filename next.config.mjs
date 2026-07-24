/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
