import GuideDjMariageClient from './GuideDjMariageClient';

export const metadata = {
  title: "Guide gratuit — 7 questions avant de choisir son DJ de mariage | Myracoustic",
  description:
    "Téléchargez gratuitement notre guide : 7 questions à poser à tout prestataire DJ de mariage avant de signer, pour comparer en toute clarté.",
  alternates: {
    canonical: '/guide-dj-mariage',
  },
  openGraph: {
    url: '/guide-dj-mariage',
    title: "Guide gratuit — 7 questions avant de choisir son DJ de mariage",
    description:
      "Téléchargez gratuitement notre guide : 7 questions à poser à tout prestataire DJ de mariage avant de signer, pour comparer en toute clarté.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Guide DJ Mariage Myracoustic' }],
  },
  twitter: {
    images: ['/particuliers-hero.jpg'],
  },
};

export default function Page() {
  return <GuideDjMariageClient />;
}
