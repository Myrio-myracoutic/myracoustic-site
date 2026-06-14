import PrivesClient from './PrivesClient';

export const metadata = {
  title: "Mariages & Événements privés — Son, Lumière, DJ",
  description:
    "Mariage, anniversaire, fête de famille : Myracoustic crée l'ambiance sonore et visuelle parfaite pour vos événements privés en Pays de la Loire.",
  alternates: {
    canonical: '/evenements-prives',
  },
  openGraph: {
    url: '/evenements-prives',
    title: "Mariages & Événements privés — Myracoustic",
    description:
      "Mariage, anniversaire, fête de famille : Myracoustic crée l'ambiance sonore et visuelle parfaite pour vos événements privés en Pays de la Loire.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Événement privé Myracoustic' }],
  },
  twitter: {
    images: ['/particuliers-hero.jpg'],
  },
};

export default function Page() {
  return <PrivesClient />;
}
