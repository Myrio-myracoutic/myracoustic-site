-- Passe le rappel d'expiration mariage d'un seul email (J-1) à 3 paliers honnêtes
-- (J-7/J-3/J-1, basés sur la vraie date d'expiration — jamais d'urgence inventée),
-- et ajoute l'équivalent pour les devis particulier (n'existait pas du tout).
alter table public.devis_proposals
  add column if not exists reminder_stage integer not null default 0;
comment on column public.devis_proposals.reminder_stage is
  '0 = aucun rappel envoyé, 1 = J-7 envoyé, 2 = J-3 envoyé, 3 = J-1 envoyé. Remis à 0 avec reminder_sent_at à chaque recalcul de valid_until.';

-- Lignes déjà relancées (reminder_sent_at posé) : ne pas leur renvoyer un J-7 en retard demain.
update public.devis_proposals set reminder_stage = 3 where reminder_sent_at is not null and reminder_stage = 0;

alter table public.qonto_quotes_tracking
  add column if not exists expiry_date date,
  add column if not exists reminder_stage integer not null default 0,
  add column if not exists reminder_sent_at timestamptz;
comment on column public.qonto_quotes_tracking.expiry_date is
  'Date d''expiration réelle du devis Qonto (posée à la création, app/api/qonto/devis/route.js) — sert au rappel automatique, jamais affichée sans être vraie.';

select cron.schedule(
  'particulier-devis-reminder-daily',
  '0 7 * * *',
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/particulier-devis-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
