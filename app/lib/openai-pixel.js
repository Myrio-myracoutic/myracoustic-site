/* Pixel de mesure OpenAI (publicités ChatGPT). L'identifiant n'est pas secret : il
   apparaît de toute façon dans le code de chaque page, comme celui du pixel Meta.
   « Pixel Myracoustic », créé par Myrio dans l'Ads Manager ChatGPT (14/11/2026). */
export const OPENAI_PIXEL_ID = '46r43sBVdaRAiJ6wG78rf6';

/* Charge le pixel (snippet officiel). Appelé UNIQUEMENT après consentement :
   tant que le visiteur n'a pas accepté, aucun script OpenAI n'est téléchargé. */
export function loadOpenAIPixel() {
  if (typeof window === 'undefined' || window.oaiq) return;
  (function (w, d, s, u) {
    if (w.oaiq) return;
    var q = function () { q.q.push(arguments); };
    q.q = [];
    w.oaiq = q;
    var js = d.createElement(s);
    js.async = true;
    js.src = u;
    var f = d.getElementsByTagName(s)[0];
    f.parentNode.insertBefore(js, f);
  })(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
  window.oaiq('consent', true);
  window.oaiq('init', { pixelId: OPENAI_PIXEL_ID });
}

/* Envoie un événement standard OpenAI (page_viewed, lead_created…). Sans pixel
   chargé (pas de consentement), l'appel est ignoré. */
export function openaiMeasure(event, data) {
  if (typeof window === 'undefined' || !window.oaiq) return;
  window.oaiq('measure', event, data);
}
