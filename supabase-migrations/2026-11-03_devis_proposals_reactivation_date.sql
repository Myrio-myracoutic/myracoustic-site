-- Date de mariage que le client propose au moment de sa demande de réactivation (voir
-- 2026-11-03_devis_proposals_reactivation_request.sql) — la même qu'avant, ou une nouvelle s'il a
-- changé de projet. Distincte de event_date : celle-ci ne bouge que si l'admin confirme la
-- réactivation (voir app/api/admin/devis-proposal/route.js).
alter table public.devis_proposals
  add column if not exists reactivation_requested_date date;

comment on column public.devis_proposals.reactivation_requested_date is
  'Date de mariage proposée par le client dans sa demande de réactivation. NULL si non renseignée.';
