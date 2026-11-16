import MariageSansStressClient from '../mariage-sans-stress/MariageSansStressClient';
import { PORTES } from '../mariage-sans-stress/portes';

// Recherche visée : « application pour organiser son mariage » (et ses proches : application
// mariage, organisation de mariage en ligne, plan de table, liste d'invités, faire-part en ligne).
const TITLE = "Application pour organiser son mariage, comprise avec votre DJ";
const DESCRIPTION =
  "Liste d'invités, réponses en ligne, plan de table, menu, faire-part et playlists : l'application pour organiser votre mariage est comprise avec votre DJ.";

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

// Fil d'Ariane : situe la page dans le site (Accueil › Mariage › Application de mariage).
const FIL_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://myracoustic.com/" },
    { "@type": "ListItem", position: 2, name: "Mariage", item: "https://myracoustic.com/mariage" },
    { "@type": "ListItem", position: 3, name: "Application de mariage", item: "https://myracoustic.com/organisation-mariage" },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FIL_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <MariageSansStressClient porte="organisation" />
    </>
  );
}
