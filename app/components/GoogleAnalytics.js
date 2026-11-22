import Script from 'next/script';
import { GA_ID } from '../lib/gtag';
import { CONSENT_COOKIE } from '../lib/consent';

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script id="ga4-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){dataLayer.push(arguments);};
          gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
          var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
          if (m && m[1] === 'granted') {
            gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
          }
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          // Cookie limité à 13 mois (recommandation CNIL, annoncé dans la politique de confidentialité) :
          // par défaut, Google Analytics le garde 2 ans. 13 mois = 395 jours = 34 128 000 secondes.
          gtag('config', '${GA_ID}', { cookie_expires: 34128000 });
        `}
      </Script>
    </>
  );
}
