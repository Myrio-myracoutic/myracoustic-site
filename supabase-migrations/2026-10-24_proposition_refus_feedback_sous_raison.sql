-- Second niveau de détail pour certaines raisons de refus (ex. "autre prestataire" →
-- moins cher / offre plus intéressante / disponible à la date / recommandé) — voir
-- app/api/proposition/[token]/refuser/route.js (SOUS_RAISONS).
alter table public.proposition_refus_feedback add column if not exists sous_raison text;
