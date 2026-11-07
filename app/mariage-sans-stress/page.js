import MariageSansStressClient from './MariageSansStressClient';

const TITLE = "DJ mariage sans stress — Son, Lumière & Vidéo";
const DESCRIPTION =
  "L'architecte de votre ambiance sonore et lumineuse pour un mariage qui vous ressemble, parfaitement orchestré. Devis personnalisé sous 48h.";

// Landing page dédiée (campagnes Ads / tests de contenu) — distincte de /mariage et /dj-mariage,
// volontairement non indexée pour ne pas cannibaliser le référencement organique.
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/mariage-sans-stress' },
  openGraph: {
    url: '/mariage-sans-stress',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Mariage Myracoustic' }],
  },
  twitter: { images: ['/particuliers-hero.jpg'] },
};

export default function Page() {
  return <MariageSansStressClient />;
}
