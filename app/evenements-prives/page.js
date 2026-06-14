import PrivesClient from './PrivesClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "Sonorisation Mariage & DJ à Nantes",
  description:
    "Mariage, anniversaire, fête de famille à Nantes et en Pays de la Loire : Myracoustic crée l'ambiance sonore et visuelle parfaite pour vos événements privés.",
  alternates: {
    canonical: '/evenements-prives',
  },
  openGraph: {
    url: '/evenements-prives',
    title: "Sonorisation Mariage & DJ à Nantes — Myracoustic",
    description:
      "Mariage, anniversaire, fête de famille à Nantes et en Pays de la Loire : Myracoustic crée l'ambiance sonore et visuelle parfaite pour vos événements privés.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Événement privé Myracoustic' }],
  },
  twitter: {
    images: ['/particuliers-hero.jpg'],
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <PrivesClient />
    </>
  );
}
