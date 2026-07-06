-- Visibilité des playlists dans l'espace client.
-- is_surprise = true  → cachée aux MARIÉS (visible accès partagés + admin)
-- hidden_from_collaborators = true → cachée aux ACCÈS PARTAGÉS (visible mariés + admin)
-- (mutuellement exclusifs, garantis côté application)
alter table playlists
  add column if not exists hidden_from_collaborators boolean not null default false;
