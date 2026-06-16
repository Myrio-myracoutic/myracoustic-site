import MariageCityClient from '../components/MariageCityClient';

const CITY = {
  nom: 'Rennes',
  region: 'Bretagne',
  departement: 'Ille-et-Vilaine',
  distance: '100 km',
  temps: '1h',
  intro: "À 100 km de Nort-sur-Erdre, Myracoustic anime des mariages à Rennes et dans toute l'Ille-et-Vilaine — DJ, sonorisation, éclairage et animation pour votre plus beau jour.",
  faq: [
    { q: 'Animez-vous des mariages à Rennes et en Ille-et-Vilaine ?',
      a: "Oui. Myracoustic anime des mariages à Rennes et dans tout le département d'Ille-et-Vilaine. Les frais de déplacement depuis Nort-sur-Erdre sont calculés automatiquement dans notre devis en ligne." },
    { q: 'Gérez-vous la cérémonie laïque pour les mariages à Rennes ?',
      a: "Oui. Sonorisation de la cérémonie laïque, micro pour l'officiant, musique d'entrée et de sortie — nous couvrons tous les moments clés de votre journée de mariage à Rennes." },
    { q: 'Dans quels lieux intervenez-vous pour les mariages en Ille-et-Vilaine ?',
      a: "Nous intervenons dans tous types de lieux : domaines et châteaux de la région rennaise, salles de réception, chapiteaux et espaces extérieurs. Une visite technique préalable est réalisée avant chaque prestation." },
    { q: 'Quel délai pour réserver votre DJ pour un mariage à Rennes ?',
      a: "Idéalement 6 à 12 mois à l'avance pour garantir notre disponibilité à votre date. N'hésitez pas à nous contacter même pour une date proche." },
    { q: 'Comment obtenir un devis DJ mariage pour Rennes ?',
      a: "Utilisez notre outil de devis en ligne. Renseignez le lieu de votre mariage en Ille-et-Vilaine — les frais de déplacement depuis Nort-sur-Erdre sont calculés automatiquement." },
  ],
};

export const metadata = {
  title: "DJ Mariage Rennes — Animation & Sonorisation",
  description: "DJ mariage professionnel à Rennes et en Ille-et-Vilaine. Myracoustic anime votre cérémonie laïque, vin d'honneur et soirée dansante. Devis gratuit en ligne.",
  alternates: { canonical: '/dj-mariage-rennes' },
  openGraph: {
    url: '/dj-mariage-rennes',
    title: "DJ Mariage Rennes — Animation & Sonorisation | Myracoustic",
    description: "DJ mariage professionnel à Rennes et en Ille-et-Vilaine. Cérémonie, animation soirée, éclairage — devis gratuit en ligne.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'DJ Mariage Rennes Myracoustic' }],
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

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <MariageCityClient city={CITY} />
    </>
  );
}
