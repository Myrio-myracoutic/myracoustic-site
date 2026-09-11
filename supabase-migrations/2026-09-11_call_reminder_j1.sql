-- Rappel automatique J-1 avant un appel programmé (mariage, devis, pro contact) — réduit les
-- rendez-vous manqués. Un seul moteur pour les 3 tunnels, comme le reste du planning d'appel
-- (voir app/lib/call-booking.js, runCallReminders). pg_cron/pg_net et le secret 'cron_secret'
-- dans Vault existent déjà (voir 2026-08-04_devis_reminder_auto.sql) — pas besoin de les recréer.

alter table public.mariage_leads add column if not exists call_reminder_sent_at timestamptz;
alter table public.qonto_quotes_tracking add column if not exists call_reminder_sent_at timestamptz;
alter table public.pro_contact_leads add column if not exists call_reminder_sent_at timestamptz;

comment on column public.mariage_leads.call_reminder_sent_at is
  'Horodatage du rappel J-1 envoyé avant l''appel programmé. NULL = pas encore envoyé.';
comment on column public.qonto_quotes_tracking.call_reminder_sent_at is
  'Horodatage du rappel J-1 envoyé avant l''appel programmé. NULL = pas encore envoyé.';
comment on column public.pro_contact_leads.call_reminder_sent_at is
  'Horodatage du rappel J-1 envoyé avant l''appel programmé. NULL = pas encore envoyé.';

select cron.schedule(
  'call-reminder-daily',
  '0 8 * * *',  -- tous les jours à 8h UTC (9h/10h Paris selon saison)
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/call-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
