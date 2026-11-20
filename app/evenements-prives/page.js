import PrivesClient from './PrivesClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "Anniversaire, Fête & Soirée Privée à Nantes",
  description:
    "Anniversaire, fête de famille, soirée entre amis à Nantes et en Pays de la Loire : un DJ qui fait danser toutes les générations. Réponse sous 24h.",
  alternates: {
    canonical: '/evenements-prives',
  },
  openGraph: {
    url: '/evenements-prives',
    title: "Anniversaire, Fête & Soirée Privée à Nantes — Myracoustic",
    description:
      "Anniversaire, fête de famille, soirée entre amis à Nantes et en Pays de la Loire : un DJ qui fait danser toutes les générations. Réponse sous 24h.",
    images: [{ url: '/evenements-prives-og.jpg', width: 1200, height: 630, alt: 'Invités qui dansent sous des fanions colorés pendant une soirée privée animée par Myracoustic' }],
  },
  twitter: {
    images: ['/evenements-prives-og.jpg'],
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
