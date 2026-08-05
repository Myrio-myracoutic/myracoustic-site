-- Suivi de tous les devis Qonto créés via le tunnel particulier (auto-envoyés ET brouillons),
-- pour combler le trou de mesure identifié le 05/08 : jusqu'ici, un brouillon (infos incomplètes)
-- n'était tracé nulle part côté Supabase, et rien ne remontait le statut "accepté" d'un devis
-- envoyé (Qonto n'a pas de webhook pour les devis — seulement pour les factures payées).
create table if not exists public.qonto_quotes_tracking (
  id uuid primary key default gen_random_uuid(),
  qonto_quote_id text not null unique,
  qonto_quote_url text,
  kind text not null check (kind in ('auto_envoye', 'brouillon')),
  client_email text not null,
  client_first_name text,
  client_last_name text,
  event_type text,
  event_date date,
  venue text,
  qonto_status text not null default 'pending_approval' check (qonto_status in ('pending_approval', 'approved', 'canceled')),
  linked_event_id uuid references public.events(id) on delete set null,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.qonto_quotes_tracking enable row level security;
grant all privileges on table public.qonto_quotes_tracking to service_role;
comment on table public.qonto_quotes_tracking is 'Suivi des devis Qonto (tunnel particulier), brouillons + envoyés, pour mesurer le taux de conversion réel.';

-- Cron : vérifie toutes les heures le statut des devis encore en attente auprès de Qonto.
select cron.schedule(
  'qonto-quote-status-hourly',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/qonto-quote-status',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
