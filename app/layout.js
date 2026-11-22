import { Space_Grotesk, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Clarity from "./components/Clarity";
import MetaPixel from "./components/MetaPixel";
import OpenAIPixel from "./components/OpenAIPixel";
import AttributionCapture from "./components/AttributionCapture";
import CookieConsent from "./components/CookieConsent";
import AriaBulle from "./components/AriaBulle";
import { SpeedInsights } from "@vercel/speed-insights/next";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  metadataBase: new URL("https://myracoustic.com"),
  title: {
    default: "Myracoustic — Son, Lumière, Vidéo & DJ",
    template: "%s — Myracoustic",
  },
  description:
    "Myracoustic, prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels en Pays de la Loire.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Myracoustic",
    title: "Myracoustic — Son, Lumière, Vidéo & DJ",
    description:
      "Prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels en Pays de la Loire.",
    images: [{ url: "/hero.png", width: 1500, height: 780, alt: "Myracoustic — Son, Lumière, Vidéo & DJ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Myracoustic — Son, Lumière, Vidéo & DJ",
    description:
      "Prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels en Pays de la Loire.",
    images: ["/hero.png"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Myracoustic",
  image: "https://myracoustic.com/hero.png",
  url: "https://myracoustic.com",
  telephone: "+33768533308",
  email: "contact@myracoustic.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nort-sur-Erdre",
    addressRegion: "Loire-Atlantique",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 47.4333,
    longitude: -1.4889,
  },
  priceRange: "€€€",
  openingHours: "Mo-Sa 10:00-18:00",
  areaServed: [
    { "@type": "City", name: "Nantes" },
    { "@type": "City", name: "Angers" },
    { "@type": "City", name: "Saint-Nazaire" },
    { "@type": "City", name: "Rennes" },
    { "@type": "City", name: "La Baule" },
    { "@type": "City", name: "Guérande" },
    { "@type": "AdministrativeArea", name: "Pays de la Loire" },
    { "@type": "AdministrativeArea", name: "Bretagne" },
    { "@type": "AdministrativeArea", name: "Poitou-Charentes" },
  ],
  description:
    "Prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels.",
  // Profils de Myracoustic sur d'autres sites : aide Google et les IA à relier ces fiches (et leurs
  // avis) à la même entreprise. Fiche Google = lien stable par numéro de fiche (cid).
  sameAs: [
    "https://maps.google.com/?cid=17436354979667455303",
    "https://www.mariages.net/musique-mariage/myracoustic--e421755",
    "https://www.instagram.com/myracoustic.com_off/",
    "https://www.youtube.com/channel/UCwkJIzar5kZ30lZDRoQGCHg",
  ],
  // Avis Google uniquement (le site affiche « ★ 5/5 sur Google »). Relevé sur la fiche le 19/11/2026 :
  // 5,0 / 5, 6 avis. À mettre à jour quand de nouveaux avis arrivent. (Mariages.net : 5,0 / 5, 3 avis.)
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    bestRating: "5",
    reviewCount: "6",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${hankenGrotesk.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: "var(--font-body), sans-serif" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <SpeedInsights />
        <GoogleAnalytics />
        <Clarity />
        <MetaPixel />
        <OpenAIPixel />
        <AttributionCapture />
        <Nav />
        <main style={{ flexGrow: 1 }}>{children}</main>
        <Footer />
        <CookieConsent />
        <AriaBulle />
      </body>
    </html>
  );
}
