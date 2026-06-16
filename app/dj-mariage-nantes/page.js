import MariageCityClient from '../components/MariageCityClient';

const CITY = {
  nom: 'Nantes',
  region: 'Pays de la Loire',
  departement: 'Loire-Atlantique',
  distance: '25 km',
  temps: '20 min',
  intro: "À 25 km de Nantes, Myracoustic est votre DJ et prestataire technique de proximité pour l'animation de mariages dans l'agglomération nantaise et le vignoble du pays nantais.",
  faq: [
    { q: 'Animez-vous des mariages à Nantes et dans l'agglomération ?',
      a: "Oui. Basé à Nort-sur-Erdre (20 minutes de Nantes), Myracoustic est un prestataire de proximité pour les mariages à Nantes et dans toute l'agglomération nantaise — centres de réception, châteaux, domaines viticoles du vignoble nantais." },
    { q: 'Gérez-vous aussi la cérémonie laïque à Nantes ?',
      a: "Oui. Nous pouvons sonoriser votre cérémonie laïque : micro pour l'officiant, musique d'entrée et de sortie personnalisée, fond sonore pendant les lectures. Un moment clé que nous préparons ensemble bien en amont." },
    { q: 'Dans quels lieux intervenez-vous pour les mariages autour de Nantes ?',
      a: "Nous intervenons dans tous types de lieux : salles de réception, châteaux, domaines et manoirs du pays nantais, chapiteaux et espaces extérieurs. Une visite technique préalable est systématique pour garantir la qualité sonore." },
    { q: 'Quel délai pour réserver votre prestation mariage à Nantes ?',
      a: "Nous recommandons de nous contacter 6 à 12 mois à l'avance pour un mariage, pour garantir notre disponibilité à votre date. N'hésitez pas à nous contacter même pour une date proche — nous faisons notre possible." },
    { q: 'Peut-on choisir la playlist musicale pour notre mariage ?',
      a: "Absolument. Morceaux incontournables, styles à privilégier ou à éviter, ouverture de bal préparée ensemble — le DJ adapte ensuite le set en temps réel à l'ambiance de la piste et au profil de vos invités." },
  ],
};

export const metadata = {
  title: "DJ Mariage Nantes — Animation & Sonorisation",
  description: "DJ mariage professionnel à Nantes. Basé à 25 km, Myracoustic anime votre cérémonie laïque, vin d'honneur et soirée dansante. Devis gratuit en ligne.",
  alternates: { canonical: '/dj-mariage-nantes' },
  openGraph: {
    url: '/dj-mariage-nantes',
    title: "DJ Mariage Nantes — Animation & Sonorisation | Myracoustic",
    description: "DJ mariage professionnel à Nantes. Cérémonie laïque, animation soirée, éclairage — prestataire basé à 25 km de Nantes.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'DJ Mariage Nantes Myracoustic' }],
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
