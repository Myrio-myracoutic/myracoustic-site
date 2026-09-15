-- Cohérence avec les autres tables backend-only (mariage_leads, qonto_quotes_tracking, etc.) :
-- RLS activé sans policy → accès refusé par défaut à anon/authenticated, uniquement le
-- service role (supabaseAdmin, utilisé par toutes les routes API qui touchent cette table) passe.
alter table public.event_milestones enable row level security;
