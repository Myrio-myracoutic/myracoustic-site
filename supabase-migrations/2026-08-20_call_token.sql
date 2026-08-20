-- Jeton public pour le lien "choisir/modifier mon créneau d'appel" envoyé par email — jamais
-- l'id brut de la fiche dans une URL publique, cohérent avec le token déjà utilisé sur
-- devis_proposals. Généré à la demande (pas de backfill nécessaire, voir ensureCallToken).
alter table public.mariage_leads add column if not exists call_token text unique;
alter table public.qonto_quotes_tracking add column if not exists call_token text unique;
alter table public.pro_contact_leads add column if not exists call_token text unique;
