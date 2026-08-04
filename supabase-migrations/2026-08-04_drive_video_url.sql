-- Lien vers un dossier Google Drive contenant les vidéos de l'événement.
-- Solution A (simple lien) retenue après discussion : la galerie photo reste sur
-- Supabase Storage (limité en taille), la vidéo continue de passer par Google Drive
-- comme déjà pratiqué, mais affichée dans l'espace client au lieu d'un envoi manuel par email.

alter table public.events
  add column if not exists drive_video_url text;

comment on column public.events.drive_video_url is
  'Lien Google Drive (dossier partagé) vers les vidéos de l''événement, affiché comme bouton dans l''espace client.';
