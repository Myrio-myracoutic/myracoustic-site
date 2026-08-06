-- Emails captés via l'aimant public (guide PDF « 7 questions avant de choisir
-- son DJ de mariage »), voir app/api/lead-magnet/route.js.
create table if not exists public.lead_magnet_signups (
  id uuid primary key default gen_random_uuid(),
  guide text not null default 'dj-mariage-7-questions',
  email text not null,
  first_name text,
  created_at timestamptz not null default now()
);

create unique index if not exists lead_magnet_signups_guide_email_unique
  on public.lead_magnet_signups (guide, email);

alter table public.lead_magnet_signups enable row level security;
grant all privileges on table public.lead_magnet_signups to service_role;
comment on table public.lead_magnet_signups is 'Emails captés via les guides téléchargeables (aimants publics).';
