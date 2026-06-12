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
          gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied' });
          var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
          if (m && m[1] === 'granted') {
            gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' });
          }
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
