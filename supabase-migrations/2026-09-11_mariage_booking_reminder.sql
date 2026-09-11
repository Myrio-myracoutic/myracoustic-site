-- Relance automatique pour un lead mariage qui n'a pas réservé de créneau d'appel dans les 2h
-- suivant sa demande (formulaire /devis/mariage-contact) — jusqu'ici le seul filet était l'appel
-- manuel de Myrio sous 24h, sans relance si le lead ne décroche pas ou n'a jamais choisi de
-- créneau. Réutilise sendBookingLinkForLead, déjà utilisé manuellement depuis l'admin
-- (voir app/lib/run-booking-reminders.js, runMariageBookingReminders).

alter table public.mariage_leads add column if not exists booking_reminder_sent_at timestamptz;

comment on column public.mariage_leads.booking_reminder_sent_at is
  'Horodatage de la relance auto envoyée si aucun créneau n''a été réservé 2h après la demande. NULL = pas encore envoyée.';

select cron.schedule(
  'mariage-booking-reminder-hourly',
  '15 * * * *',  -- toutes les heures à :15
  $$
  select net.http_get(
    url := 'https://myracoustic.com/api/cron/booking-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
