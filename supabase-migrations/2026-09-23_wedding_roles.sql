-- Fonction d'un accès partagé (Wedding Planner voit tout, Marié/Mariée = traité comme le
-- compte principal pour la visibilité des surprises) + identité du compte principal.
-- La colonne event_collaborators.role existait déjà mais n'était jamais renseignée
-- (toujours 'collaborator' par défaut) : on la structure au lieu d'en créer une nouvelle.

alter table event_collaborators
  drop constraint if exists event_collaborators_role_check;
alter table event_collaborators
  alter column role set default 'collaborator';
update event_collaborators set role = 'collaborator' where role is null;
alter table event_collaborators
  add constraint event_collaborators_role_check
  check (role in ('collaborator', 'wedding_planner', 'marie', 'mariee'));

alter table clients
  add column if not exists civil_role text;
alter table clients
  add constraint clients_civil_role_check
  check (civil_role is null or civil_role in ('marie', 'mariee'));
