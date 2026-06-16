import MariageCityClient from '../components/MariageCityClient';

const CITY = {
  nom: 'Saint-Nazaire',
  region: 'Pays de la Loire',
  departement: 'Loire-Atlantique',
  distance: '60 km',
  temps: '45 min',
  intro: "À 60 km de Nort-sur-Erdre, Myracoustic anime des mariages à Saint-Nazaire, La Baule, Guérande et sur toute la côte guérandaise.",
  faq: [
    { q: 'Animez-vous des mariages à Saint-Nazaire et sur la côte ?',
      a: "Oui. Myracoustic anime des mariages à Saint-Nazaire, La Baule, Guérande, Pornichet et dans toute la presqu'île guérandaise. Salles de réception, domaines bord de mer ou à la campagne — nous nous adaptons à tous les lieux." },
    { q: 'Gérez-vous la cérémonie laïque pour les mariages côtiers ?',
      a: "Oui. Pour les cérémonies en extérieur ou dans des espaces atypiques, nous adaptons notre sonorisation à la configuration du lieu pour garantir une qualité sonore irréprochable même sans acoustique de salle." },
    { q: 'Dans quels lieux intervenez-vous pour les mariages en presqu'île guérandaise ?',
      a: "Nous intervenons dans tous types de lieux de la presqu'île : salles de réception, domaines, espaces événementiels bord de mer, chapiteaux et jardins. Une visite technique préalable est systématique." },
    { q: 'Quel délai pour réserver votre DJ pour un mariage sur la côte ?',
      a: "Idéalement 6 à 12 mois à l'avance, notamment pour les saisons de haute fréquentation en bord de mer. N'hésitez pas à nous contacter en dehors de ces créneaux — nous faisons notre possible." },
    { q: 'Comment obtenir un devis DJ mariage pour Saint-Nazaire ou La Baule ?',
      a: "Utilisez notre outil de devis en ligne. Renseignez le lieu de votre mariage — les frais de déplacement depuis Nort-sur-Erdre sont calculés automatiquement." },
  ],
};

export const metadata = {
  title: "DJ Mariage Saint-Nazaire — Animation & Sonorisation",
  description: "DJ mariage professionnel à Saint-Nazaire, La Baule et la presqu'île guérandaise. Myracoustic anime votre cérémonie et soirée dansante. Devis gratuit en ligne.",
  alternates: { canonical: '/dj-mariage-saint-nazaire' },
  openGraph: {
    url: '/dj-mariage-saint-nazaire',
    title: "DJ Mariage Saint-Nazaire — Animation & Sonorisation | Myracoustic",
    description: "DJ mariage professionnel à Saint-Nazaire et sur la côte guérandaise. Cérémonie, animation soirée, éclairage — devis gratuit en ligne.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'DJ Mariage Saint-Nazaire Myracoustic' }],
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
