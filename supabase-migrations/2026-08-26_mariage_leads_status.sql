-- Notes de suivi libres par dossier — indépendantes du devis (qui a déjà son propre admin_note),
-- pour savoir "où on en est" même avant qu'un devis existe.
alter table public.mariage_leads add column if not exists admin_note text;

-- Unifie le vocabulaire de statut (jamais affiché par aucune UI avant ce chantier, donc sans
-- risque de régression) : nouveau → en_cours → gagne / perdu.
update public.mariage_leads set status = 'en_cours' where status = 'devis_fait';
update public.mariage_leads set status = 'gagne' where status = 'devis_valide';
