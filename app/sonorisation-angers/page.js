import CityPageClient from '../components/CityPageClient';

const CITY = {
  nom: 'Angers',
  region: 'Pays de la Loire',
  departement: 'Maine-et-Loire',
  distance: '90 km',
  temps: '55 min',
  zones: ['Angers', 'Cholet', 'Saumur', 'Segré', 'Maine-et-Loire', 'Pays de la Loire'],
  intro: "Myracoustic est votre prestataire technique pour la sonorisation, l'éclairage, la vidéo et l'animation DJ de vos événements à Angers et dans tout le Maine-et-Loire — mariages, soirées privées, séminaires et galas d'entreprise.",
  faq: [
    { q: 'Proposez-vous la sonorisation pour des événements à Angers ?',
      a: "Oui. Basé à Nort-sur-Erdre, Myracoustic intervient régulièrement à Angers et dans tout le Maine-et-Loire pour des mariages, soirées d'entreprise, séminaires et événements privés." },
    { q: 'Quelle est la distance entre votre base et Angers ?',
      a: "Environ 90 km depuis Nort-sur-Erdre, soit 50 à 55 minutes de trajet. Les frais de déplacement sont calculés automatiquement dans notre outil de devis selon la distance exacte de votre lieu." },
    { q: 'Intervenez-vous pour des mariages en Maine-et-Loire ?',
      a: "Oui. Nous animons régulièrement des mariages en Maine-et-Loire, dans les domaines, châteaux et salles de réception de la région angevine et au-delà. Notre page dédiée mariage vous donnera un aperçu complet." },
    { q: 'Quelle est la différence entre vos prestations particuliers et entreprises ?',
      a: "Pour les particuliers (mariages, anniversaires), nous proposons sonorisation, éclairage et animation DJ. Pour les entreprises (séminaires, conventions, galas), nous proposons sonorisation, éclairage, écran LED et régie technique complète." },
    { q: 'Comment obtenir un devis pour une prestation à Angers ?',
      a: "Utilisez notre outil de devis en ligne. Renseignez votre lieu (l'estimation de trajet est automatique), le type d'événement et vos besoins — vous obtenez une estimation en moins de 2 minutes." },
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
