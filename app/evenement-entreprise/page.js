import EntrepriseClient from './EntrepriseClient';

export const metadata = {
  title: "Événements d'entreprise — Son, Lumière, Vidéo",
  description:
    "Sonorisation, éclairage, écran LED et régie technique pour vos séminaires, conventions et galas d'entreprise de 80 à 400 personnes en Pays de la Loire.",
  alternates: {
    canonical: '/evenement-entreprise',
  },
  openGraph: {
    url: '/evenement-entreprise',
    title: "Événements d'entreprise — Myracoustic",
    description:
      "Sonorisation, éclairage, écran LED et régie technique pour vos séminaires, conventions et galas d'entreprise de 80 à 400 personnes en Pays de la Loire.",
    images: [{ url: '/seminaire_myracoustic_nantes.jpg', width: 1200, height: 630, alt: "Séminaire d'entreprise Myracoustic" }],
  },
  twitter: {
    images: ['/seminaire_myracoustic_nantes.jpg'],
  },
};

export default function Page() {
  return <EntrepriseClient />;
}
