-- Source de vérité pour le CA signé, alimentée directement depuis Qonto (tous les devis
-- réellement approuvés par le client, peu importe leur origine — site ou créés à la main dans
-- Qonto). Le champ fiable côté Qonto est `approved_at` rempli, PAS le statut "approved" seul
-- (qui peut apparaître sur des devis jamais confirmés par le client — vérifié le 19/08/2026).
create table if not exists public.qonto_signed_quotes (
  id uuid primary key default gen_random_uuid(),
  qonto_quote_id text not null unique,
  number text,
  client_name text,
  client_email text,
  vertical text check (vertical in ('mariage','particulier','professionnel')), -- null si indéterminé
  amount numeric not null,
  approved_at timestamptz not null,
  event_id uuid references public.events(id) on delete set null,
  source text not null default 'sync' check (source in ('sync','backfill')),
  created_at timestamptz not null default now()
);
alter table public.qonto_signed_quotes enable row level security;
grant all privileges on table public.qonto_signed_quotes to service_role;
comment on table public.qonto_signed_quotes is 'CA signé réel (devis Qonto avec approved_at rempli), toute origine confondue — jamais recalculé depuis devis_proposals/qonto_quotes_tracking seuls, qui ne couvrent que ce qui passe par le site.';
