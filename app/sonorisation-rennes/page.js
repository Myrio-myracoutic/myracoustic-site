import CityPageClient from '../components/CityPageClient';

const CITY = {
  nom: 'Rennes',
  region: 'Bretagne',
  departement: 'Ille-et-Vilaine',
  distance: '100 km',
  temps: '1h',
  zones: ['Rennes', 'Saint-Malo', 'Vitré', 'Fougères', 'Ille-et-Vilaine', 'Bretagne'],
  intro: "Myracoustic est votre prestataire technique pour la sonorisation, l'éclairage, la vidéo et l'animation DJ de vos événements à Rennes et dans toute l'Ille-et-Vilaine — mariages, soirées privées, séminaires et galas d'entreprise.",
  faq: [
    { q: 'Proposez-vous la sonorisation à Rennes et en Bretagne ?',
      a: "Oui. Myracoustic intervient à Rennes et dans tout le département d'Ille-et-Vilaine pour des mariages, soirées d'entreprise, séminaires et événements privés. Nous couvrons également une partie de la Bretagne selon la nature du projet." },
    { q: 'Quelle est la distance entre votre base et Rennes ?',
      a: "Environ 100 km depuis Nort-sur-Erdre, soit environ 1 heure de trajet. Les frais de déplacement sont calculés automatiquement dans notre outil de devis selon la distance exacte de votre lieu." },
    { q: 'Intervenez-vous pour des mariages en Ille-et-Vilaine ?',
      a: "Oui. Nous animons des mariages en Ille-et-Vilaine dans des domaines, châteaux et salles de réception. Notre page dédiée mariage vous donnera un aperçu complet de notre offre pour votre grand jour." },
    { q: 'Quelle est la différence entre vos prestations particuliers et entreprises ?',
      a: "Pour les particuliers (mariages, anniversaires), nous proposons sonorisation, éclairage et animation DJ. Pour les entreprises (séminaires, conventions, galas), nous proposons sonorisation, éclairage, écran LED et régie technique complète." },
    { q: 'Comment obtenir un devis pour un événement à Rennes ?',
      a: "Utilisez notre outil de devis en ligne. Renseignez le lieu de l'événement, le type de prestation et vos besoins — vous obtenez une estimation en moins de 2 minutes avec les frais de déplacement inclus." },
  ],
};

export const metadata = {
  title: "Sonorisation Événementielle à Rennes",
  description: "Myracoustic, prestataire de sonorisation à Rennes et en Ille-et-Vilaine : son, éclairage, vidéo et DJ pour mariages, événements privés et séminaires d'entreprise.",
  alternates: { canonical: '/sonorisation-rennes' },
  openGraph: {
    url: '/sonorisation-rennes',
    title: "Sonorisation Événementielle à Rennes — Myracoustic",
    description: "Prestataire de sonorisation à Rennes et en Ille-et-Vilaine : son, éclairage, vidéo et DJ pour mariages et événements d'entreprise.",
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
  name: "Sonorisation événementielle à Rennes",
  provider: { "@type": "LocalBusiness", name: "Myracoustic", url: "https://myracoustic.com" },
  areaServed: ["Rennes", "Ille-et-Vilaine", "Bretagne"],
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
