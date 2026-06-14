import SonorisationNantesClient from './SonorisationNantesClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "Sonorisation Événementielle à Nantes",
  description:
    "Myracoustic, prestataire de sonorisation événementielle à Nantes : son, éclairage, vidéo et DJ pour mariages, soirées privées, séminaires et galas d'entreprise.",
  alternates: {
    canonical: '/sonorisation-nantes',
  },
  openGraph: {
    url: '/sonorisation-nantes',
    title: "Sonorisation Événementielle à Nantes — Myracoustic",
    description:
      "Prestataire de sonorisation événementielle à Nantes : son, éclairage, vidéo et DJ pour mariages, soirées privées, séminaires et galas d'entreprise.",
  },
};

const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Sonorisation événementielle",
  name: "Sonorisation événementielle à Nantes",
  description:
    "Conception et exploitation de dispositifs de sonorisation, éclairage, vidéo et animation DJ pour événements privés et professionnels à Nantes et en Pays de la Loire.",
  provider: {
    "@type": "LocalBusiness",
    name: "Myracoustic",
    url: "https://myracoustic.com",
  },
  areaServed: ['Nantes', 'Nort-sur-Erdre', 'Angers', 'Rennes', 'Saint-Nazaire', 'Pays de la Loire', 'Bretagne', 'Poitou-Charentes'],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <SonorisationNantesClient />
    </>
  );
}
