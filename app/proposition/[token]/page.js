import PropositionTokenClient from './PropositionTokenClient';

export const metadata = {
  title: 'Votre proposition de devis — Myracoustic',
  robots: { index: false },
};

export default async function PropositionTokenPage({ params }) {
  const { token } = await params;
  return <PropositionTokenClient token={token} />;
}
