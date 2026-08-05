/* Qonto n'a pas de webhook pour les devis (seulement pour les factures payées) — on
   interroge donc périodiquement le statut des devis encore en attente (cron horaire,
   voir app/api/cron/qonto-quote-status). Comble le trou de mesure identifié le 05/08 :
   jusque-là, un devis accepté par le client ne se voyait nulle part avant le paiement. */
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function runQontoQuoteStatus() {
  const { data: pending, error } = await supabaseAdmin
    .from('qonto_quotes_tracking')
    .select('id, qonto_quote_id, linked_event_id')
    .eq('qonto_status', 'pending_approval');

  if (error) return { checked: 0, updated: 0, error: error.message };

  let updated = 0;
  const results = [];

  for (const row of pending || []) {
    try {
      const res = await fetch(`${QONTO_BASE}/quotes/${row.qonto_quote_id}`, { headers: qHeaders() });
      if (!res.ok) { results.push({ id: row.id, status: 'fetch_error' }); continue; }
      const data = await res.json();
      const qontoStatus = data.quote?.status; // pending_approval | approved | canceled

      await supabaseAdmin
        .from('qonto_quotes_tracking')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', row.id);

      if (!qontoStatus || qontoStatus === 'pending_approval') continue;

      await supabaseAdmin
        .from('qonto_quotes_tracking')
        .update({ qonto_status: qontoStatus })
        .eq('id', row.id);
      updated++;

      // Devis accepté et lié à un événement déjà créé (chemin auto-envoyé) : on fait
      // avancer le statut, sans jamais écraser une progression déjà plus loin (confirmé, terminé...).
      if (qontoStatus === 'approved' && row.linked_event_id) {
        const { data: ev } = await supabaseAdmin
          .from('events').select('status').eq('id', row.linked_event_id).maybeSingle();
        if (ev?.status === 'devis_envoye') {
          await supabaseAdmin.from('events').update({ status: 'accepte' }).eq('id', row.linked_event_id);
        }
      }

      results.push({ id: row.id, status: qontoStatus });
    } catch (err) {
      results.push({ id: row.id, status: 'error', error: err.message });
    }
  }

  return { checked: (pending || []).length, updated, results };
}
