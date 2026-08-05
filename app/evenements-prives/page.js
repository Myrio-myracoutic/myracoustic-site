import PrivesClient from './PrivesClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "Anniversaire, Fête & Soirée Privée à Nantes — Myracoustic",
  description:
    "Anniversaire, fête de famille, soirée privée à Nantes et en Pays de la Loire : Myracoustic crée l'ambiance sonore et visuelle parfaite pour votre événement.",
  alternates: {
    canonical: '/evenements-prives',
  },
  openGraph: {
    url: '/evenements-prives',
    title: "Anniversaire, Fête & Soirée Privée à Nantes — Myracoustic",
    description:
      "Anniversaire, fête de famille, soirée privée à Nantes et en Pays de la Loire : Myracoustic crée l'ambiance sonore et visuelle parfaite pour votre événement.",
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
