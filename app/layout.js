import { Space_Grotesk, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

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
  title: "Myracoustic — Son, Lumière, Vidéo & DJ",
  description:
    "Myracoustic, prestataire événementiel : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels.",
  icons: {
    icon: "/favicon.png",
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
        <Nav />
        <main style={{ flexGrow: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
