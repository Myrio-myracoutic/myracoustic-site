-- Planning d'appel pour les tunnels particulier + pro ciblé : même principe que
-- mariage_leads.call_* (voir 2026-08-04_call_schedule.sql), rattaché ici à
-- qonto_quotes_tracking puisque c'est la fiche déjà créée par ces deux tunnels.
alter table public.qonto_quotes_tracking
  add column if not exists client_phone text,
  add column if not exists call_scheduled_at timestamptz,
  add column if not exists call_duration_minutes integer not null default 15,
  add column if not exists call_google_event_id text,
  add column if not exists call_cancelled_at timestamptz;

create unique index if not exists qonto_quotes_tracking_call_slot_unique
  on public.qonto_quotes_tracking (call_scheduled_at)
  where call_scheduled_at is not null and call_cancelled_at is null;
