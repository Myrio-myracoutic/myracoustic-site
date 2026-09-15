-- Suivi post-signature : rendez-vous d'accompagnement liés à un événement (présentation de la
-- plateforme, visite du lieu à 6 mois, point à 1 mois, derniers réglages à 2 semaines).
-- Une ligne par étape par événement, avec les mêmes colonnes de rendez-vous que mariage_leads
-- (call_scheduled_at etc., voir 2026-08-04_mariage_leads_call_slot.sql) pour brancher directement
-- le moteur de réservation existant (app/lib/call-booking.js, 4e "kind" : event_milestone) —
-- pas de logique de réservation dupliquée.

create table if not exists public.event_milestones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  milestone_type text not null check (milestone_type in ('presentation', 'visite_lieu', 'point_1_mois', 'reglages_2_semaines')),
  target_date date,
  call_scheduled_at timestamptz,
  call_duration_minutes integer not null default 15,
  call_google_event_id text,
  call_cancelled_at timestamptz,
  call_token text unique,
  call_reminder_sent_at timestamptz,
  admin_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, milestone_type)
);

comment on column public.event_milestones.target_date is
  'Date indicative de l''étape (calculée depuis event_date). NULL pour "presentation" (à réserver dès que possible, pas liée à une échéance).';
comment on column public.event_milestones.call_reminder_sent_at is
  'Rappel J-1 envoyé au client avant l''appel programmé. NULL = pas encore envoyé.';
comment on column public.event_milestones.admin_reminder_sent_at is
  'Rappel interne envoyé à Myracoustic pour penser à prendre rendez-vous avec le client. NULL = pas encore envoyé.';

create index if not exists event_milestones_event_id_idx on public.event_milestones (event_id);

-- Empêche deux étapes de réserver le même créneau (garde-fou base, même pattern que
-- mariage_leads_call_slot_unique) — le vrai garde-fou inter-tunnels reste le freebusy
-- Google Calendar partagé (lib/call-slots.js), celui-ci ne couvre que cette table.
create unique index if not exists event_milestones_call_slot_unique
  on public.event_milestones (call_scheduled_at)
  where call_scheduled_at is not null and call_cancelled_at is null;
