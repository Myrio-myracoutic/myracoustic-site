-- Oubli à la création de la table (voir 2026-09-14_event_milestones.sql) : RLS activé sans
-- policy bloque aussi le service_role sans un GRANT explicite, même pattern que
-- devis_proposals (2026-07-21_devis_proposals.sql) — sinon "permission denied" côté serveur.
grant all privileges on table public.event_milestones to service_role;
