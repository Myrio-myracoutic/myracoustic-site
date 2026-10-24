import RefuserClient from './RefuserClient';

export const metadata = {
  title: 'Votre avis — Myracoustic',
  robots: { index: false },
};

export default async function RefuserPage({ params }) {
  const { token } = await params;
  return <RefuserClient token={token} />;
}
