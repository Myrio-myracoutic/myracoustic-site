import RendezVousClient from './RendezVousClient';

export const metadata = {
  title: 'Mon rendez-vous — Myracoustic',
  robots: { index: false, follow: false },
};

export default async function RendezVousPage({ params }) {
  const { token } = await params;
  return <RendezVousClient token={token} />;
}
