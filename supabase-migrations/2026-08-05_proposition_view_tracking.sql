-- Suivi de consultation de la proposition de devis (page publique /proposition/[token]) :
-- combien de fois le prospect revient dessus + quand, pour repérer un lead "chaud"
-- ou un devis qui laisse le prospect indécis.
alter table public.devis_proposals
  add column if not exists viewed_count integer not null default 0,
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at timestamptz;

-- Rattrapage : ces colonnes existaient déjà en base (ajoutées hors migration à un moment
-- non tracé) mais n'avaient jamais été déclarées ici — la convention du projet veut que
-- toute colonne vive dans une migration datée. `if not exists` = sans effet en prod,
-- utile pour qu'un nouvel environnement (local, staging) reproduise le schéma réel.
alter table public.devis_proposals
  add column if not exists token uuid not null default gen_random_uuid(),
  add column if not exists valid_until date,
  add column if not exists acompte_2x boolean not null default false;
