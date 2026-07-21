-- Propositions de devis créées par l'admin après l'appel (modèle « lead → appel »).
-- Lue et écrite côté serveur uniquement (service role).
create table if not exists public.devis_proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.mariage_leads(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete cascade,
  formule text,
  formule_name text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  event_date date,
  venue text,
  guests integer,
  admin_note text,
  status text not null default 'proposee',   -- proposee / validee / refusee
  adresse text,
  cp text,
  ville text,
  qonto_quote_id text,
  qonto_quote_url text,
  validated_at timestamptz
);

alter table public.devis_proposals enable row level security;

comment on table public.devis_proposals is 'Propositions de devis (admin). status proposee/validee/refusee. Adresse + qonto remplis à la validation (Phase 3).';
