/* Vocabulaire d'origine partagé — doit rester identique à la contrainte SQL (voir
   supabase-migrations/2026-08-25_lead_source.sql + 2026-08-30_lead_source_bark_mariagesnet.sql)
   et à app/lib/attribution.js (menu déclaratif public). Utilisé par les routes admin qui
   permettent de poser/corriger l'origine à la main (mariage-leads, qonto-quotes, pro-contacts). */
export const SOURCE_VALUES = ['google_ads', 'recherche_google', 'reseaux_sociaux', 'bouche_a_oreille', 'salon_du_mariage', 'bark', 'mariages_net', 'autre'];
