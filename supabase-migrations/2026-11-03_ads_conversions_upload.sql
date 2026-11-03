-- Upload automatique des conversions vers Google Ads depuis le gclid stocké en base.
-- Contourne le trou de suivi découvert le 03/11 : un lead soumis sans avoir cliqué "Accepter"
-- sur le bandeau cookies est invisible pour generate_lead (importé depuis GA4, soumis au Consent
-- Mode). Voir mémoire projet "google-ads-mcp" et "bug-cta-cache-cookies-mobile".

alter table public.mariage_leads
  add column if not exists ads_conversion_uploaded_at timestamptz;

alter table public.pro_contact_leads
  add column if not exists ads_conversion_uploaded_at timestamptz;

comment on column public.mariage_leads.ads_conversion_uploaded_at is
  'Horodatage de l''envoi du gclid à Google Ads (upload hors-ligne, conversion action UPLOAD_CLICKS 7887716776). Null = pas encore envoyé.';
comment on column public.pro_contact_leads.ads_conversion_uploaded_at is
  'Horodatage de l''envoi du gclid à Google Ads (upload hors-ligne, conversion action UPLOAD_CLICKS 7887716776). Null = pas encore envoyé.';

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Réutilise le secret 'cron_secret' déjà stocké dans Supabase Vault (voir
-- 2026-08-04_devis_reminder_auto.sql) — rien à refaire si déjà en place.

select cron.schedule(
  'ads-conversions-upload',
  '*/30 * * * *',  -- toutes les 30 minutes
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/ads-conversions-upload',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
