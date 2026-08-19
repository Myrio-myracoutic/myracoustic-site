-- La verticale ne doit plus dépendre uniquement d'un event_id lié (certains vrais paiements
-- n'ont aucun événement Supabase correspondant — ex. client Qonto sans email, créé hors site,
-- découvert le 19/08/2026 avec SCI Buffon : 884,48 € payés, invisibles car aucun email ne
-- permettait de les rattacher à un événement). On la pose directement sur qonto_payments, en
-- priorité depuis le devis signé associé (qonto_signed_quotes, déjà classé), avec event_id
-- comme repli pour compatibilité avec les lignes déjà enregistrées.
alter table public.qonto_payments add column if not exists vertical text
  check (vertical in ('mariage','particulier','professionnel'));

update public.qonto_payments p set vertical = e.vertical
from public.events e where p.event_id = e.id and p.vertical is null and e.vertical is not null;
