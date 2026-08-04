-- Suivi de l'email "merci + avis" envoyé au passage du statut événement à 'termine' :
-- date d'envoi (pour le bouton de relance manuelle) + clics sur chaque lien d'avis
-- (pour mesurer, avant d'envisager une relance ciblée plus tard).

alter table public.events
  add column if not exists avis_email_sent_at timestamptz,
  add column if not exists avis_google_clicked_at timestamptz,
  add column if not exists avis_mariagenet_clicked_at timestamptz;

comment on column public.events.avis_email_sent_at is
  'Dernier envoi de l''email "merci + avis" (auto au passage en terminé, ou relance manuelle admin).';
comment on column public.events.avis_google_clicked_at is
  'Horodatage du clic sur le lien d''avis Google (via /api/track/avis).';
comment on column public.events.avis_mariagenet_clicked_at is
  'Horodatage du clic sur le lien d''avis Mariages.net (via /api/track/avis).';
