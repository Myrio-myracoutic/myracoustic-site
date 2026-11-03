-- Un client revenu sur une proposition refusée/expirée peut demander sa réactivation
-- (bouton sur /proposition/[token]) — objectif : ne pas fermer la porte, repérer qui est
-- toujours intéressé pour que Myrio propose une alternative. La réactivation reste manuelle,
-- décidée en admin (voir app/api/admin/devis-proposal/route.js).
alter table public.devis_proposals
  add column if not exists reactivation_requested_at timestamptz;

comment on column public.devis_proposals.reactivation_requested_at is
  'Horodatage de la demande de réactivation faite par le client sur une proposition refusée/expirée. NULL = aucune demande en attente.';
