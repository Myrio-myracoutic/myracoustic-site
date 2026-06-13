import Script from 'next/script';
import { CONSENT_COOKIE } from '../lib/consent';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function Clarity() {
  if (!CLARITY_ID) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
        var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
        window.clarity('consent', !!(m && m[1] === 'granted'));
      `}
    </Script>
  );
}
