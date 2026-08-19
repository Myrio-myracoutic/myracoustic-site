-- Fondations pour le dashboard KPI : verticale explicite, montants signés/encaissés.
-- Voir plan validé le 19/08/2026 (mémoire project_kpi_dashboard_plan).

-- Verticale explicite sur events (jamais déduite de event_type texte libre ou clients.profil,
-- qui ne distingue pas mariage de particulier)
alter table public.events add column if not exists vertical text
  check (vertical in ('mariage','particulier','professionnel'));
update public.events set vertical = 'mariage' where event_type = 'Mariage' and vertical is null;
update public.events e set vertical = c.profil
  from public.clients c where e.client_id = c.id and e.vertical is null and c.profil in ('particulier','professionnel');

-- Montant "signé" côté mariage (post-réduction — devis_proposals.total est AVANT réduction)
alter table public.devis_proposals add column if not exists montant_final numeric;

-- Montant "signé" côté particulier/pro + distinction fiable individual/company dès la création
alter table public.qonto_quotes_tracking add column if not exists total_ttc numeric;
alter table public.qonto_quotes_tracking add column if not exists client_kind text
  check (client_kind in ('individual','company'));

-- Date de conversion (prospect → client), posée une seule fois
alter table public.events add column if not exists confirmed_at timestamptz;

-- Registre des encaissements réels (CA encaissé, distinct du CA signé) — alimenté uniquement par
-- le webhook Qonto et le cron de rattrapage qonto-sync, jamais interrogé à la volée pour l'affichage.
create table if not exists public.qonto_payments (
  id uuid primary key default gen_random_uuid(),
  qonto_invoice_id text not null unique,
  event_id uuid references public.events(id) on delete set null,
  invoice_type text check (invoice_type in ('deposit','balance')),
  amount numeric not null,
  paid_at date not null,
  source text not null default 'webhook' check (source in ('webhook','sync_cron')),
  created_at timestamptz not null default now()
);
alter table public.qonto_payments enable row level security;
grant all privileges on table public.qonto_payments to service_role;
comment on table public.qonto_payments is 'CA encaissé réel (factures Qonto payées) — jamais interrogé à la volée depuis Qonto pour le dashboard.';

-- Date d'entrée exploitable pour les tunnels particulier abandonnés (upsert existant :
-- n'écrase que les colonnes listées, default now() ne s'applique qu'à l'insertion initiale)
alter table public.devis_particulier_progress add column if not exists created_at timestamptz not null default now();
