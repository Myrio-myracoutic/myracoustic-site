-- Élargit le vocabulaire d'origine (16/11) : pubs Meta et ChatGPT détectées automatiquement
-- (meta_ads, chatgpt_ads) + réponses du menu « Comment nous avez-vous connu ? »
-- (instagram, facebook, chatgpt). 'reseaux_sociaux' reste valide (anciennes fiches).
-- À exécuter AVANT la mise en ligne du code. Ne supprime aucune donnée.

alter table public.mariage_leads drop constraint if exists mariage_leads_source_check;
alter table public.mariage_leads add constraint mariage_leads_source_check
  check (source in ('google_ads','meta_ads','chatgpt_ads','recherche_google','instagram','facebook','chatgpt','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.devis_particulier_progress drop constraint if exists devis_particulier_progress_source_check;
alter table public.devis_particulier_progress add constraint devis_particulier_progress_source_check
  check (source in ('google_ads','meta_ads','chatgpt_ads','recherche_google','instagram','facebook','chatgpt','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.pro_contact_leads drop constraint if exists pro_contact_leads_source_check;
alter table public.pro_contact_leads add constraint pro_contact_leads_source_check
  check (source in ('google_ads','meta_ads','chatgpt_ads','recherche_google','instagram','facebook','chatgpt','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));

alter table public.qonto_quotes_tracking drop constraint if exists qonto_quotes_tracking_source_check;
alter table public.qonto_quotes_tracking add constraint qonto_quotes_tracking_source_check
  check (source in ('google_ads','meta_ads','chatgpt_ads','recherche_google','instagram','facebook','chatgpt','reseaux_sociaux','bouche_a_oreille','salon_du_mariage','bark','mariages_net','autre'));
