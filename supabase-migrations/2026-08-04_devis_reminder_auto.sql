-- Rappel automatique J-1 avant expiration d'un devis mariage (status 'proposee').
-- Programmé côté base via pg_cron (indépendant des 2 crons Vercel déjà utilisés
-- par qonto/sync et payment-reminder, plan gratuit). Voir mémoire projet
-- "audit-acquisition" et "relance-devis-auto".

alter table public.devis_proposals
  add column if not exists reminder_sent_at timestamptz;

comment on column public.devis_proposals.reminder_sent_at is
  'Horodatage du dernier rappel J-1 envoyé (auto ou manuel). Remis à null à chaque recalcul de valid_until.';

-- Extensions nécessaires pour programmer un appel HTTP depuis la base.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Le secret CRON_SECRET est lu depuis Supabase Vault (jamais en clair ici).
-- À faire une seule fois, côté Dashboard Supabase → SQL Editor, en collant la vraie valeur :
--   select vault.create_secret('<valeur de CRON_SECRET copiée depuis Vercel>', 'cron_secret', 'Secret partagé avec les routes /api/cron/*');
-- Tant que ce secret n'existe pas, le job s'exécute mais l'appel HTTP échoue silencieusement (401).

select cron.schedule(
  'devis-reminder-daily',
  '0 7 * * *',  -- tous les jours à 7h UTC
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/devis-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
