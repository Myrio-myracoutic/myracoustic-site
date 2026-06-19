import GoogleAnalytics from '../components/GoogleAnalytics';
import Clarity from '../components/Clarity';
import CookieConsent from '../components/CookieConsent';
import CookiePrefsLink from '../components/CookiePrefsLink';

export const metadata = {
  title: 'Myracoustic — Demande de devis',
  description:
    'Demandez votre devis Myracoustic : son, lumière, vidéo et DJ pour mariages, événements privés et professionnels.',
};

export default function DevisLayout({ children }) {
  return (
    <>
      <GoogleAnalytics />
      <Clarity />
      <main style={{ flexGrow: 1 }}>{children}</main>
      <CookiePrefsLink />
      <CookieConsent />
    </>
  );
}
