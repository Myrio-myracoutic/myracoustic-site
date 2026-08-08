-- Le cron de vérification du statut des devis Qonto (approved/canceled) passe
-- de toutes les heures à toutes les 10 minutes, pour que le badge "Accepté"
-- en admin (/admin/prospects) reflète la réalité plus vite. Demandé par Myrio le 08/08.
select cron.unschedule('qonto-quote-status-hourly');
select cron.schedule(
  'qonto-quote-status-10min',
  '*/10 * * * *',
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/qonto-quote-status',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
