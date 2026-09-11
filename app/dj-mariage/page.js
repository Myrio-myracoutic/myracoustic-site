import DjMariageClient from './DjMariageClient';
import { getAvailableSaturdays } from '../../lib/get-available-saturdays';

const TITLE = "Mariage Haut de Gamme — Son, Lumière & DJ en Pays de la Loire | Myracoustic";
const DESCRIPTION =
  "Une seule équipe pour orchestrer le son, la lumière, la vidéo et l'animation de votre mariage en château, domaine ou demeure de caractère. Devis personnalisé sous 48h.";

// Page dédiée aux campagnes Google Ads — volontairement non indexée pour ne pas cannibaliser
// le référencement de /mariage sur les mêmes requêtes (message-match pub → page distinct).
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/dj-mariage' },
  openGraph: {
    url: '/dj-mariage',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Mariage Myracoustic' }],
  },
  twitter: { images: ['/particuliers-hero.jpg'] },
};

export const revalidate = 3600;

export default async function Page() {
  const availability = await getAvailableSaturdays();
  return <DjMariageClient availability={availability} />;
}
