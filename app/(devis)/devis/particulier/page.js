import ParticulierDemandeClient from './ParticulierDemandeClient';

// Demande d'un particulier (17/11) : remplace le devis instantané (ancien tunnel DevisFlow).
// Comme le formulaire mariage, la page n'est pas indexée : on y arrive depuis /evenements-prives.
export const metadata = {
  title: 'Demander mon devis — Événement privé — Myracoustic',
  description: 'Anniversaire, soirée privée, baptême : parlez de votre événement à Myracoustic. Devis gratuit et sans engagement, nous vous rappelons sous 24h.',
  robots: { index: false },
};

export default function DevisParticulierPage() {
  return <ParticulierDemandeClient />;
}
