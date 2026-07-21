import MariageContactClient from './MariageContactClient';

export const metadata = {
  title: 'Demander mon devis mariage — Myracoustic',
  description: 'Parlez de votre mariage à un conseiller Myracoustic. Devis gratuit et sans engagement, on vous rappelle sous 24h.',
  robots: { index: false },
};

export default function MariageContactPage() {
  return <MariageContactClient />;
}
