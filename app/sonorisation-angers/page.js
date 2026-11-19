import CityPageClient from '../components/CityPageClient';

const CITY = {
  nom: 'Angers',
  region: 'Pays de la Loire',
  departement: 'Maine-et-Loire',
  zones: ['Angers', 'Cholet', 'Saumur', 'Segré', 'Maine-et-Loire', 'Pays de la Loire'],
  intro: "Myracoustic est votre prestataire technique pour la sonorisation, l'éclairage, la vidéo et l'animation DJ de vos événements à Angers et dans tout le Maine-et-Loire — mariages, soirées privées, séminaires et galas d'entreprise.",
  faq: [
    { q: 'Proposez-vous la sonorisation pour des événements à Angers ?',
      a: "Oui. Basé à Nort-sur-Erdre, Myracoustic intervient régulièrement à Angers et dans tout le Maine-et-Loire pour des mariages, soirées d'entreprise, séminaires et événements privés." },
    { q: 'Y a-t-il des frais de déplacement pour un événement à Angers ?',
      a: "Nous intervenons régulièrement à Angers. Les frais de déplacement éventuels sont indiqués clairement dans votre devis." },
    { q: 'Intervenez-vous pour des mariages en Maine-et-Loire ?',
      a: "Oui. Nous animons régulièrement des mariages en Maine-et-Loire, dans les domaines, châteaux et salles de réception de la région angevine et au-delà. Notre page dédiée mariage vous donnera un aperçu complet." },
    { q: 'Quelle est la différence entre vos prestations particuliers et entreprises ?',
      a: "Pour les particuliers (mariages, anniversaires), nous proposons sonorisation, éclairage et animation DJ. Pour les entreprises (séminaires, conventions, galas), nous proposons sonorisation, éclairage, écran LED et régie technique complète." },
    { q: 'Comment obtenir un devis pour une prestation à Angers ?',
      a: "Remplissez notre formulaire de demande : date, lieu et besoins. Nous vous rappelons sous 24h (jours ouvrés), puis vous recevez une proposition sur mesure, gratuite et sans engagement." },
  ],
};

export const metadata = {
  title: "Sonorisation Événementielle à Angers",
  description: "Myracoustic, prestataire de sonorisation événementielle à Angers : son, éclairage, vidéo et DJ pour mariages, soirées privées et séminaires en Maine-et-Loire.",
  alternates: { canonical: '/sonorisation-angers' },
  openGraph: {
    url: '/sonorisation-angers',
    title: "Sonorisation Événementielle à Angers — Myracoustic",
    description: "Prestataire de sonorisation à Angers : son, éclairage, vidéo et DJ pour mariages, soirées et séminaires en Maine-et-Loire.",
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CITY.faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Sonorisation événementielle",
  name: "Sonorisation événementielle à Angers",
  provider: { "@type": "LocalBusiness", name: "Myracoustic", url: "https://myracoustic.com" },
  areaServed: ["Angers", "Maine-et-Loire", "Pays de la Loire"],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <CityPageClient city={CITY} />
    </>
  );
}
