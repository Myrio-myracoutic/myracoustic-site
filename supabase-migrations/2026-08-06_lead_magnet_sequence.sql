-- Séquence de relance automatique après le téléchargement du guide (5 emails,
-- espacés de 3 jours) — voir app/lib/run-lead-magnet-sequence.js.
alter table public.lead_magnet_signups
  add column if not exists sequence_step integer not null default 0,
  add column if not exists sequence_next_at timestamptz,
  add column if not exists sequence_stopped_at timestamptz;

comment on column public.lead_magnet_signups.sequence_step is
  'Nombre d''emails de la séquence déjà envoyés (0 à 5).';
comment on column public.lead_magnet_signups.sequence_next_at is
  'Date du prochain envoi ; null si la séquence est terminée (5/5) et n''a jamais été relancée depuis.';

-- Job quotidien : même mécanisme que devis-reminder-daily / qonto-quote-status-hourly
-- (pg_cron + pg_net, secret CRON_SECRET lu depuis Supabase Vault, déjà en place).
select cron.schedule(
  'lead-magnet-sequence-daily',
  '0 8 * * *',  -- tous les jours à 8h UTC
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/lead-magnet-sequence',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
