-- Demande d'avis automatique 1 jour après l'événement, indépendante du statut
-- (pas besoin de clore le dossier / publier la galerie pour redemander un avis à chaud).
-- Réutilise le secret 'cron_secret' déjà posé en Vault pour la relance devis / qonto sync.

select cron.schedule(
  'avis-email-daily',
  '0 9 * * *',  -- tous les jours à 9h UTC
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/avis-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
