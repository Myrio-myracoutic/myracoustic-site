import EntrepriseClient from './EntrepriseClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "Prestataire Technique Événementiel à Nantes",
  description:
    "Sonorisation professionnelle, éclairage, écran LED et régie technique pour vos séminaires, conventions et galas d'entreprise à Nantes et en Pays de la Loire (80 à 400 personnes).",
  alternates: {
    canonical: '/evenement-entreprise',
  },
  openGraph: {
    url: '/evenement-entreprise',
    title: "Prestataire Technique Événementiel à Nantes — Myracoustic",
    description:
      "Sonorisation professionnelle, éclairage, écran LED et régie technique pour vos séminaires, conventions et galas d'entreprise à Nantes et en Pays de la Loire (80 à 400 personnes).",
    images: [{ url: '/seminaire_myracoustic_nantes.jpg', width: 1200, height: 630, alt: "Séminaire d'entreprise Myracoustic" }],
  },
  twitter: {
    images: ['/seminaire_myracoustic_nantes.jpg'],
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
      <EntrepriseClient />
    </>
  );
}
