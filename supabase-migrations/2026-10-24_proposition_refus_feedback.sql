-- Retour du client quand il décline une proposition de devis (bouton « je refuse l'offre » sur
-- /proposition/[token]) — comprendre pourquoi, dans un but d'amélioration du service.
-- Lue et écrite côté serveur uniquement (service role), même pattern que devis_proposals.
create table if not exists public.proposition_refus_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references public.devis_proposals(id) on delete cascade,
  lead_id uuid references public.mariage_leads(id) on delete set null,
  raison text not null,
  commentaire text
);

create index if not exists proposition_refus_feedback_proposal_id_idx
  on public.proposition_refus_feedback (proposal_id);

alter table public.proposition_refus_feedback enable row level security;
grant all privileges on table public.proposition_refus_feedback to service_role;

comment on table public.proposition_refus_feedback is
  'Réponses au questionnaire affiché quand un client refuse une proposition de devis.';
