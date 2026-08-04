-- Créneau d'appel réservé par un lead mariage (calendrier façon Calendly).

alter table public.mariage_leads
  add column if not exists call_scheduled_at timestamptz,
  add column if not exists call_duration_minutes integer not null default 15,
  add column if not exists call_google_event_id text,
  add column if not exists call_cancelled_at timestamptz;

comment on column public.mariage_leads.call_scheduled_at is 'Créneau d''appel réservé (15 min). NULL = pas encore réservé.';

-- Empêche deux leads de réserver le même créneau (garde-fou au niveau base, pas seulement applicatif).
-- Index partiel : ignore les créneaux annulés, pour permettre de réserver à nouveau ce créneau.
create unique index if not exists mariage_leads_call_slot_unique
  on public.mariage_leads (call_scheduled_at)
  where call_scheduled_at is not null and call_cancelled_at is null;
