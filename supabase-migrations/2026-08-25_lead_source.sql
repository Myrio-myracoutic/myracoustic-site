-- Origine d'un prospect : capture automatique (clic pub Google Ads via gclid) + déclaratif
-- ("Comment nous avez-vous connu ?") pour le reste. Rien n'est deviné : source reste NULL si
-- ni l'un ni l'autre n'a rien capté. Voir app/components/AttributionCapture.js.

alter table public.mariage_leads add column if not exists gclid text;
alter table public.mariage_leads add column if not exists utm_source text;
alter table public.mariage_leads add column if not exists utm_medium text;
alter table public.mariage_leads add column if not exists utm_campaign text;
alter table public.mariage_leads add column if not exists source text
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','autre'));

alter table public.devis_particulier_progress add column if not exists gclid text;
alter table public.devis_particulier_progress add column if not exists utm_source text;
alter table public.devis_particulier_progress add column if not exists utm_medium text;
alter table public.devis_particulier_progress add column if not exists utm_campaign text;
alter table public.devis_particulier_progress add column if not exists source text
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','autre'));

alter table public.pro_contact_leads add column if not exists gclid text;
alter table public.pro_contact_leads add column if not exists utm_source text;
alter table public.pro_contact_leads add column if not exists utm_medium text;
alter table public.pro_contact_leads add column if not exists utm_campaign text;
alter table public.pro_contact_leads add column if not exists source text
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','autre'));

alter table public.qonto_quotes_tracking add column if not exists gclid text;
alter table public.qonto_quotes_tracking add column if not exists utm_source text;
alter table public.qonto_quotes_tracking add column if not exists utm_medium text;
alter table public.qonto_quotes_tracking add column if not exists utm_campaign text;
alter table public.qonto_quotes_tracking add column if not exists source text
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','autre'));
