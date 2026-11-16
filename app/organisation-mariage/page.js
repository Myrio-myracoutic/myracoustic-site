import MariageSansStressClient from '../mariage-sans-stress/MariageSansStressClient';

const TITLE = "Application pour organiser votre mariage, comprise avec votre DJ";
const DESCRIPTION =
  "Invités, plan de table, menu, faire-part et playlists dans une seule application, comprise dans la prestation Myracoustic avec le DJ, le son, la lumière et le film de votre soirée.";

// Porte d'entrée « organisation » (voir mariage-sans-stress/portes.js) : capte ceux qui cherchent
// un outil pour organiser leur mariage et leur montre qu'il est compris avec le DJ. Page réservée
// aux publicités pour l'instant : non indexée, absente du sitemap, comme /mariage-sans-stress.
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/organisation-mariage' },
  openGraph: {
    url: '/organisation-mariage',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Mariage Myracoustic' }],
  },
  twitter: { images: ['/particuliers-hero.jpg'] },
};

export default function Page() {
  return <MariageSansStressClient porte="organisation" />;
}
