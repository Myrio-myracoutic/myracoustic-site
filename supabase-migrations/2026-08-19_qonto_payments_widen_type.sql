-- Qonto a plus de types de facture que prévu (deposit/balance/standard/partial...) — la contrainte
-- initiale aurait rejeté silencieusement de vrais paiements (ex. facture "standard" pour des
-- heures supplémentaires, découvert le 19/08/2026 avec Carine Grelier : 100€ de prestation
-- technique en plus, jamais liés au devis d'origine). On ne restreint plus ce champ, il reflète
-- simplement Qonto tel quel.
alter table public.qonto_payments drop constraint if exists qonto_payments_invoice_type_check;
