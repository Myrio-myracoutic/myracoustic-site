-- Rappel interne quotidien (à Myracoustic) pour prendre rendez-vous sur une étape du suivi
-- post-signature (visite du lieu à 6 mois, point à 1 mois, derniers réglages à 2 semaines) —
-- voir app/lib/run-milestone-admin-reminders.js et 2026-09-14_event_milestones.sql.
-- pg_cron/pg_net et le secret 'cron_secret' dans Vault existent déjà (voir
-- 2026-08-04_devis_reminder_auto.sql) — pas besoin de les recréer.

select cron.schedule(
  'milestone-admin-reminder-daily',
  '0 7 * * *',  -- tous les jours à 7h UTC (8h/9h Paris selon saison), avant le rappel client à 8h
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/milestone-admin-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
