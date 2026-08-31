-- Ajoute Bark.com et Mariages.net au vocabulaire d'origine (2026-08-25_lead_source.sql) — Myrio
-- reçoit réellement des leads via ces deux plateformes, en plus des canaux déjà suivis.

alter table public.mariage_leads drop constraint if exists mariage_leads_source_check;
alter table public.mariage_leads add constraint mariage_leads_source_check
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.devis_particulier_progress drop constraint if exists devis_particulier_progress_source_check;
alter table public.devis_particulier_progress add constraint devis_particulier_progress_source_check
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.pro_contact_leads drop constraint if exists pro_contact_leads_source_check;
alter table public.pro_contact_leads add constraint pro_contact_leads_source_check
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.qonto_quotes_tracking drop constraint if exists qonto_quotes_tracking_source_check;
alter table public.qonto_quotes_tracking add constraint qonto_quotes_tracking_source_check
  check (source in ('google_ads','recherche_google','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));
