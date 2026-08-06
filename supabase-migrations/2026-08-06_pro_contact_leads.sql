-- Le formulaire de contact pro simple (/api/contact/pro, submitContactPro dans DevisFlow.js)
-- n'avait jusqu'ici aucune persistance (email uniquement) — nécessaire pour lui rattacher
-- un planning d'appel comme les autres tunnels.
create table if not exists public.pro_contact_leads (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  societe text not null,
  email text not null,
  tel text not null,
  poste text,
  event_type text,
  personnes text,
  event_date text, -- champ libre côté formulaire (pas un vrai date picker), donc pas de type date
  budget text,
  lieu text,
  description text,
  call_scheduled_at timestamptz,
  call_duration_minutes integer not null default 15,
  call_google_event_id text,
  call_cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists pro_contact_leads_call_slot_unique
  on public.pro_contact_leads (call_scheduled_at)
  where call_scheduled_at is not null and call_cancelled_at is null;

alter table public.pro_contact_leads enable row level security;
grant all privileges on table public.pro_contact_leads to service_role;
comment on table public.pro_contact_leads is 'Demandes de contact pro simples (sans devis Qonto) — persistées pour permettre le planning d''appel.';
