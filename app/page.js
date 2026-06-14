import HomeClient from './HomeClient';

export const metadata = {
  title: "Son, Lumière, Vidéo & DJ pour vos événements",
  description:
    "Myracoustic, prestataire événementiel en Pays de la Loire : son, lumière, vidéo et DJ pour mariages, anniversaires et événements d'entreprise.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: "Myracoustic — Son, Lumière, Vidéo & DJ pour vos événements",
    description:
      "Prestataire événementiel en Pays de la Loire : son, lumière, vidéo et DJ pour mariages, anniversaires et événements d'entreprise.",
  },
};

export default function Page() {
  return <HomeClient />;
}
