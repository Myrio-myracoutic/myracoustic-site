import HomeClient from './HomeClient';

export const metadata = {
  title: "Sonorisation, Lumière, Vidéo & DJ à Nantes",
  description:
    "Myracoustic, prestataire événementiel à Nantes et en Pays de la Loire : sonorisation, lumière, vidéo et DJ pour mariages, anniversaires et événements d'entreprise.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: "Myracoustic — Sonorisation, Lumière, Vidéo & DJ à Nantes",
    description:
      "Prestataire événementiel à Nantes et en Pays de la Loire : sonorisation, lumière, vidéo et DJ pour mariages, anniversaires et événements d'entreprise.",
  },
};

export default function Page() {
  return <HomeClient />;
}
