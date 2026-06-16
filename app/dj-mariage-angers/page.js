import MariageCityClient from '../components/MariageCityClient';

const CITY = {
  nom: 'Angers',
  region: 'Pays de la Loire',
  departement: 'Maine-et-Loire',
  distance: '90 km',
  temps: '55 min',
  intro: "À 90 km de Nort-sur-Erdre, Myracoustic anime des mariages à Angers, dans les domaines et châteaux du Val de Loire et dans tout le Maine-et-Loire.",
  faq: [
    { q: 'Animez-vous des mariages à Angers et en Maine-et-Loire ?',
      a: "Oui. Myracoustic anime des mariages à Angers et dans tout le Maine-et-Loire — domaines, châteaux, salles de réception. Les frais de déplacement depuis Nort-sur-Erdre sont calculés automatiquement dans notre devis." },
    { q: 'Gérez-vous la cérémonie laïque pour les mariages à Angers ?',
      a: "Oui. Sonorisation de la cérémonie laïque, micro sans fil pour l'officiant, musique d'entrée et de sortie personnalisée — nous prenons en charge tous les moments clés de votre journée." },
    { q: 'Dans quels lieux intervenez-vous pour les mariages en Maine-et-Loire ?',
      a: "Nous intervenons dans tous types de lieux du Maine-et-Loire : domaines du Val de Loire, châteaux, salles de réception, chapiteaux et espaces extérieurs. Une visite technique préalable est systématique." },
    { q: 'Quel délai pour réserver votre DJ pour un mariage à Angers ?',
      a: "Idéalement 6 à 12 mois à l'avance pour un mariage, pour garantir notre disponibilité. N'hésitez pas à nous contacter même pour une date proche — nous faisons notre possible." },
    { q: 'Comment obtenir un devis DJ mariage pour Angers ?',
      a: "Utilisez notre outil de devis en ligne. Renseignez le lieu de votre mariage — les frais de déplacement depuis Nort-sur-Erdre vers Angers sont calculés automatiquement." },
  ],
};

export const metadata = {
  title: "DJ Mariage Angers — Animation & Sonorisation",
  description: "DJ mariage professionnel à Angers et en Maine-et-Loire. Myracoustic anime votre cérémonie laïque, vin d'honneur et soirée dansante. Devis gratuit en ligne.",
  alternates: { canonical: '/dj-mariage-angers' },
  openGraph: {
    url: '/dj-mariage-angers',
    title: "DJ Mariage Angers — Animation & Sonorisation | Myracoustic",
    description: "DJ mariage professionnel à Angers et en Maine-et-Loire. Cérémonie, animation soirée, éclairage — devis gratuit en ligne.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'DJ Mariage Angers Myracoustic' }],
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
