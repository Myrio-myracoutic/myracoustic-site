import MariageSansStressClient from '../mariage-sans-stress/MariageSansStressClient';
import { PORTES } from '../mariage-sans-stress/portes';

const TITLE = "Application pour organiser votre mariage, comprise avec votre DJ";
const DESCRIPTION =
  "Invités, plan de table, menu, faire-part et playlists dans une seule application, comprise avec votre DJ, le son, la lumière et le film de votre soirée.";

// Porte d'entrée « organisation » (voir mariage-sans-stress/portes.js) : capte ceux qui cherchent
// un outil pour organiser leur mariage et leur montre qu'il est compris avec le DJ.
// Page indexée (demande de Myrio du 16/11) : elle doit pouvoir être trouvée par une recherche
// classique, pas seulement par les publicités. Elle est donc dans app/sitemap.js, liée depuis le
// pied de page du site, et ses questions propres sont déclarées à Google ci-dessous.
// /mariage-sans-stress, dont elle reprend la trame, reste non indexée : pas de contenu en double.
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/organisation-mariage' },
  openGraph: {
    url: '/organisation-mariage',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Mariage Myracoustic' }],
  },
  twitter: { images: ['/particuliers-hero.jpg'] },
};

// Uniquement les questions propres à cette porte : elles sont affichées en tête de la FAQ.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PORTES.organisation.faq.map(({ q, a }) => ({
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
      <MariageSansStressClient porte="organisation" />
    </>
  );
}
