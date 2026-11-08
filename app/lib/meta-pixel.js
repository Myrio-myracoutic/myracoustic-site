export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/* Charge le pixel Meta (snippet officiel). Appelé UNIQUEMENT après consentement :
   tant que le visiteur n'a pas accepté, aucun script Meta n'est téléchargé. */
export function loadMetaPixel() {
  if (typeof window === 'undefined' || !META_PIXEL_ID || window.fbq) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  // Pas d'événements automatiques (clics de boutons, contenu de la page) :
  // on n'envoie que PageView et Lead, déclenchés par le code.
  window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
  window.fbq('init', META_PIXEL_ID);
}

/* Envoie un événement standard Meta. Sans pixel chargé (pas de consentement,
   pas d'ID configuré), l'appel est ignoré. */
export function metaTrack(event, params = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, params);
}
