-- Test paiement échelonné (27/10/2026) : sur chaque proposition de devis mariage, l'admin choisit
-- entre « en 2 fois » (50 % signature / 50 % jour J, mode historique) et « échelonné »
-- (10 % signature pour bloquer la date / 40 % avant une date fixée par l'admin / 50 % jour J).
alter table public.devis_proposals
  add column if not exists payment_mode text not null default 'deux_fois'
    check (payment_mode in ('deux_fois', 'echelonne')),
  add column if not exists second_payment_due date;

comment on column public.devis_proposals.payment_mode is
  'deux_fois = 50/50 ; echelonne = 10 % signature, 40 % avant second_payment_due, 50 % jour J.';
comment on column public.devis_proposals.second_payment_due is
  'Date limite du 2e versement (40 %) en mode echelonne — fixée et modifiable par l''admin.';
