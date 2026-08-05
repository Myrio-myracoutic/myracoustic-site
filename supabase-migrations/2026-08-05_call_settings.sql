-- Réglages globaux du calendrier d'appel — pour l'instant, uniquement la durée d'un créneau
-- (configurable en admin, plutôt que codée en dur, pour ne pas redemander un changement de code
-- à chaque fois que la durée doit changer).

create table if not exists public.call_settings (
  id integer primary key default 1,
  slot_duration_minutes integer not null default 15 check (slot_duration_minutes > 0),
  updated_at timestamptz not null default now(),
  constraint call_settings_singleton check (id = 1)
);

alter table public.call_settings enable row level security;
grant all privileges on table public.call_settings to service_role;

comment on table public.call_settings is 'Réglages globaux du calendrier d''appel (ligne unique, id=1).';

insert into public.call_settings (id, slot_duration_minutes) values (1, 15)
on conflict (id) do nothing;
