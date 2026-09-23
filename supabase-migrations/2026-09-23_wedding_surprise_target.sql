-- Étape 2 du système Wedding Planner / Marié-Mariée :
-- - hidden_from_role permet à un conjoint tagué (marie/mariee) de cacher une playlist
--   spécifiquement à l'autre conjoint (et pas à tout le monde), sans la cacher aux témoins.
-- - Labels informatifs supplémentaires pour les accès partagés classiques (témoin, famille,
--   ami) : purs libellés d'affichage, aucun effet sur les droits (seuls wedding_planner/
--   marie/mariee changent la visibilité — voir app/lib/event-access.js).

alter table event_collaborators
  drop constraint if exists event_collaborators_role_check;
alter table event_collaborators
  add constraint event_collaborators_role_check
  check (role in ('collaborator', 'wedding_planner', 'marie', 'mariee', 'temoin', 'famille', 'ami', 'autre'));

alter table playlists
  add column if not exists hidden_from_role text;
alter table playlists
  add constraint playlists_hidden_from_role_check
  check (hidden_from_role is null or hidden_from_role in ('marie', 'mariee'));
