-- Demande pro (/devis/professionnel) : type de structure et besoins cochés (parcours pro, étape 2).
-- La structure décidera de l'accord : signature en ligne, ou validation interne pour une collectivité.
-- Simple ajout de colonnes.
alter table public.pro_contact_leads
  add column if not exists structure text check (structure in ('entreprise', 'collectivite', 'association')),
  add column if not exists besoins text[];
