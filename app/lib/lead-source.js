/* Vocabulaire d'origine partagé — doit rester identique à la contrainte SQL (voir
   supabase-migrations/2026-08-25_lead_source.sql + 2026-08-30_lead_source_bark_mariagesnet.sql)
   et à app/lib/attribution.js (menu déclaratif public). Utilisé par les routes admin qui
   permettent de poser/corriger l'origine à la main (mariage-leads, qonto-quotes, pro-contacts). */
export const SOURCE_VALUES = ['google_ads', 'meta_ads', 'chatgpt_ads', 'recherche_google', 'instagram', 'facebook', 'chatgpt', 'reseaux_sociaux', 'bouche_a_oreille', 'salon_du_mariage', 'bark', 'mariages_net', 'autre'];

/* Origine d'une demande, calculée côté serveur à partir de ce que le formulaire transmet
   (16/11). Ordre : 1) un clic publicitaire prouvé gagne toujours ; 2) sinon la réponse du
   visiteur au menu « Comment nous avez-vous connu ? » ; 3) sinon un indice automatique non
   publicitaire. Conventions d'étiquettes des pubs : docs/meta-retargeting-mariage.md
   (utm_source=facebook + utm_medium=paid) et docs/chatgpt-ads-test-mariage.md
   (utm_source=chatgpt_ads). `fbclid` seul = arrivée depuis Facebook ou Instagram, sans
   savoir lequel ni si c'était une pub → « réseaux sociaux ». Rien d'inventé : null si
   aucun indice. */
export function resolveSource({ gclid, fbclid, oppref, utm_source, utm_medium, sourceDeclared } = {}) {
  const src = String(utm_source || '').toLowerCase();
  const paid = /paid|cpc|ppc|ads/.test(String(utm_medium || '').toLowerCase());
  const meta = /facebook|instagram|meta|^fb$|^ig$/.test(src);
  const chatgpt = /chatgpt|openai/.test(src);

  if (gclid) return 'google_ads';
  if (oppref || src === 'chatgpt_ads' || (chatgpt && paid)) return 'chatgpt_ads';
  if (meta && paid) return 'meta_ads';
  if (sourceDeclared && SOURCE_VALUES.includes(sourceDeclared)) return sourceDeclared;
  if (chatgpt) return 'chatgpt';
  if (/instagram|^ig$/.test(src)) return 'instagram';
  if (/facebook|^fb$/.test(src)) return 'facebook';
  if (fbclid || meta) return 'reseaux_sociaux';
  return null;
}
