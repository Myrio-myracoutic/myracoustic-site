import Script from 'next/script';

/* Capture l'origine d'un visiteur (clic pub Google Ads via gclid, ou utm_*) au premier
   atterrissage sur le site, et la garde en localStorage jusqu'à ce qu'un des 3 formulaires
   d'entrée (mariage-contact, tunnel particulier/pro, contact pro) la lise et la transmette.
   Premier contact gagne : on n'écrase jamais une attribution déjà stockée, sinon un visiteur
   revenu plus tard en direct effacerait la preuve qu'il vient d'une pub. Voir app/lib/attribution.js
   côté lecture. Pattern volontairement en <Script> vanilla-JS (comme GoogleAnalytics.js/Clarity.js)
   plutôt qu'un hook React + Suspense — plus simple pour une capture aussi élémentaire. */
export default function AttributionCapture() {
  return (
    <Script id="attribution-capture" strategy="afterInteractive">
      {`
        try {
          if (!window.localStorage.getItem('myr_attribution')) {
            var p = new URLSearchParams(window.location.search);
            var gclid = p.get('gclid');
            var utmSource = p.get('utm_source');
            var utmMedium = p.get('utm_medium');
            var utmCampaign = p.get('utm_campaign');
            if (gclid || utmSource) {
              window.localStorage.setItem('myr_attribution', JSON.stringify({
                gclid: gclid || null,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
                capturedAt: new Date().toISOString(),
              }));
            }
          }
        } catch (e) { /* localStorage indisponible (navigation privée, etc.) — pas grave, tant pis pour l'attribution */ }
      `}
    </Script>
  );
}
