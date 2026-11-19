import CityPageClient from '../components/CityPageClient';

const CITY = {
  nom: 'Saint-Nazaire',
  region: 'Pays de la Loire',
  departement: 'Loire-Atlantique',
  zones: ['Saint-Nazaire', 'La Baule', 'Guérande', 'Pornichet', 'Nort-sur-Erdre', 'Loire-Atlantique'],
  intro: "Myracoustic est votre prestataire technique pour la sonorisation, l'éclairage, la vidéo et l'animation DJ de vos événements à Saint-Nazaire, sur la côte et en presqu'île guérandaise.",
  faq: [
    { q: 'Proposez-vous la sonorisation à Saint-Nazaire et sur la côte ?',
      a: "Oui. Myracoustic intervient à Saint-Nazaire, La Baule, Guérande, Pornichet et dans toute la presqu'île guérandaise pour mariages, anniversaires, séminaires et événements d'entreprise." },
    { q: 'Y a-t-il des frais de déplacement pour un événement à Saint-Nazaire ?',
      a: "Nous intervenons régulièrement à Saint-Nazaire. Les frais de déplacement éventuels sont indiqués clairement dans votre devis." },
    { q: "Intervenez-vous pour des mariages en presqu'île guérandaise ?",
      a: "Oui. La presqu'île guérandaise et la région de La Baule sont parmi les zones où nous intervenons régulièrement pour des mariages, dans des domaines, espaces événementiels en bord de mer ou à l'intérieur des terres." },
    { q: 'Proposez-vous aussi des prestations en extérieur ?',
      a: "Oui. Pour les événements en extérieur (jardins, terrasses, espaces naturels), nous adaptons le dispositif de sonorisation à la configuration du lieu pour garantir une couverture homogène et une bonne intelligibilité." },
    { q: 'Comment obtenir un devis pour Saint-Nazaire ou La Baule ?',
      a: "Remplissez notre formulaire de demande : date, lieu et besoins. Nous vous rappelons sous 24h (jours ouvrés), puis vous recevez une proposition sur mesure, gratuite et sans engagement." },
  ],
};

export const metadata = {
  title: "Sonorisation Événementielle à Saint-Nazaire",
  description: "Myracoustic, prestataire de sonorisation à Saint-Nazaire, La Baule et la côte guérandaise : son, éclairage, vidéo et DJ pour mariages, soirées et séminaires.",
  alternates: { canonical: '/sonorisation-saint-nazaire' },
  openGraph: {
    url: '/sonorisation-saint-nazaire',
    title: "Sonorisation Événementielle à Saint-Nazaire — Myracoustic",
    description: "Prestataire de sonorisation à Saint-Nazaire et sur la côte guérandaise : son, éclairage, vidéo et DJ pour mariages et événements d'entreprise.",
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
  name: "Sonorisation événementielle à Saint-Nazaire",
  provider: { "@type": "LocalBusiness", name: "Myracoustic", url: "https://myracoustic.com" },
  areaServed: ["Saint-Nazaire", "La Baule", "Guérande", "Loire-Atlantique"],
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
