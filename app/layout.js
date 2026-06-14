import { Space_Grotesk, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Clarity from "./components/Clarity";
import CookieConsent from "./components/CookieConsent";

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
  areaServed: ["Pays de la Loire", "Bretagne", "Poitou-Charentes"],
  description:
    "Prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels.",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "4",
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
        <GoogleAnalytics />
        <Clarity />
        <Nav />
        <main style={{ flexGrow: 1 }}>{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
