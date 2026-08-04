-- Passe la synchro Qonto → Google Calendar de 1x/jour (cron Vercel) à toutes les 15 min,
-- via pg_cron Supabase — contourne la limite du plan gratuit Vercel (1 cron/jour).
-- Réutilise le secret 'cron_secret' déjà posé en Vault pour la relance devis.
-- Voir mémoire projet "cron-qonto-sync" et "audit-acquisition".

select cron.schedule(
  'qonto-sync-15min',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/qonto/sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
