-- Réduction « du moment » sur une proposition de devis (outil de relance).
-- discount_type : 'amount' (€) ou 'percent' (%)
-- discount_value : le montant/pourcentage saisi par l'admin
-- discount_until : date limite de la réduction (déclenche le chrono côté client)
-- La réduction n'est honorée que si le client valide avant discount_until.

alter table devis_proposals
  add column if not exists discount_type  text,
  add column if not exists discount_value numeric,
  add column if not exists discount_until date;
