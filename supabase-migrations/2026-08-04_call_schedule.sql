-- Planning unique des créneaux d'appel (jours + horaires), éditable en admin.
-- Une ligne = une plage horaire pour un jour de semaine (permet plusieurs plages/jour,
-- ex. coupure déjeuner). Pas de multi-personnes : un seul planning global.

create table if not exists public.call_schedule (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = lundi ... 6 = dimanche
  start_time time not null,
  end_time time not null check (end_time > start_time),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.call_schedule enable row level security;
grant all privileges on table public.call_schedule to service_role;

comment on table public.call_schedule is 'Planning unique des créneaux d''appel (jours + horaires), éditable en admin.';

-- Valeurs par défaut (lun-ven 9h-18h) pour que le système fonctionne dès le déploiement.
insert into public.call_schedule (weekday, start_time, end_time, enabled)
values (0,'09:00','18:00',true), (1,'09:00','18:00',true), (2,'09:00','18:00',true),
       (3,'09:00','18:00',true), (4,'09:00','18:00',true)
on conflict do nothing;
