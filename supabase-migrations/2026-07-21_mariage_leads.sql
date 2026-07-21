-- Table des leads du formulaire de contact mariage (Phase 1 du modèle « lead → appel »).
-- Écrite et lue uniquement côté serveur (service role, qui contourne RLS).
create table if not exists public.mariage_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prenom text not null,
  nom text not null,
  tel text not null,
  email text not null,
  event_date date,
  guests integer,
  lieu text,
  message text,
  status text not null default 'nouveau',
  client_id uuid references public.clients(id) on delete set null
);

alter table public.mariage_leads enable row level security;

-- Le rôle serveur (service_role) doit avoir les droits explicitement : sans ça,
-- l'API renvoie 403 (permission denied) même si RLS est contournée.
grant all privileges on table public.mariage_leads to service_role;

comment on table public.mariage_leads is 'Leads du formulaire de contact mariage. status: nouveau/rappele/devis_fait. client_id rempli en Phase 2.';
