import GuideDjMariageClient from './GuideDjMariageClient';
import { GUIDE_TITLE, GUIDE_QUESTIONS, ARTICLE } from './guide-data.mjs';

const BASE = 'https://myracoustic.com';
const URL_PAGE = `${BASE}/guide-dj-mariage`;
const DESCRIPTION =
  "Les 7 questions à poser à un DJ de mariage avant de signer, et les réponses à attendre. Le guide de Myrio, DJ depuis 26 ans et plus de 200 mariages animés.";

export const metadata = {
  title: GUIDE_TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/guide-dj-mariage',
  },
  authors: [{ name: ARTICLE.auteur }],
  openGraph: {
    type: 'article',
    url: '/guide-dj-mariage',
    title: GUIDE_TITLE,
    description: DESCRIPTION,
    publishedTime: ARTICLE.publie,
    modifiedTime: ARTICLE.modifie,
    authors: [ARTICLE.auteur],
    images: [{ url: '/particuliers-hero.jpg', width: 1500, height: 780, alt: 'Guide DJ mariage Myracoustic' }],
  },
  twitter: {
    images: ['/particuliers-hero.jpg'],
  },
};

// Article signé : auteur, dates, éditeur. Aide Google et les IA à savoir qui parle et depuis quand.
const ARTICLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: GUIDE_TITLE,
  description: DESCRIPTION,
  inLanguage: 'fr-FR',
  datePublished: ARTICLE.publie,
  dateModified: ARTICLE.modifie,
  mainEntityOfPage: URL_PAGE,
  image: `${BASE}/particuliers-hero.jpg`,
  author: {
    '@type': 'Person',
    name: ARTICLE.auteur,
    jobTitle: ARTICLE.fonction,
    worksFor: { '@type': 'Organization', name: 'Myracoustic', url: BASE },
  },
  publisher: {
    '@type': 'Organization',
    name: 'Myracoustic',
    url: BASE,
    logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
  },
};

// Les 7 questions et les réponses visibles sur la page.
const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GUIDE_QUESTIONS.map((q) => ({
    '@type': 'Question',
    name: q.title,
    acceptedAnswer: { '@type': 'Answer', text: `${q.goodAnswer} Chez Myracoustic : ${q.chezNous}` },
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <GuideDjMariageClient />
    </>
  );
}
