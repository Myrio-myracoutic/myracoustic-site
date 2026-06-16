import MariageClient from './MariageClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata = {
  title: "DJ Mariage Nantes — Sonorisation & Animation | Myracoustic",
  description:
    "DJ mariage professionnel à Nantes et Pays de la Loire. Sonorisation cérémonie, animation soirée dansante, éclairage — un seul prestataire pour votre plus beau jour.",
  alternates: {
    canonical: '/mariage',
  },
  openGraph: {
    url: '/mariage',
    title: "DJ Mariage Nantes — Sonorisation & Animation | Myracoustic",
    description:
      "DJ mariage professionnel à Nantes et Pays de la Loire. Sonorisation cérémonie, animation soirée dansante, éclairage — un seul prestataire pour votre plus beau jour.",
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'DJ Mariage Myracoustic Nantes' }],
  },
  twitter: {
    images: ['/particuliers-hero.jpg'],
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <MariageClient />
    </>
  );
}
