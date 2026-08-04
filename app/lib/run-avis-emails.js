import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendAvisEmail } from '@/app/lib/send-avis-email';

/* Demande d'avis automatique, à partir de 1 jour après event_date — indépendante du statut
   (pas besoin de clore le dossier / publier la galerie pour redemander un avis à chaud).
   <= hier (pas seulement = hier) pour rattraper tout événement passé jamais relancé,
   par exemple si le job a échoué un jour donné.
   Éligible : événement confirmé ou déjà clos (pas annulé), pas déjà envoyé. */
export async function runAvisEmails() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('id, event_type, clients(first_name, email)')
    .lte('event_date', yesterdayStr)
    .in('status', ['confirme', 'termine'])
    .is('avis_email_sent_at', null);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const ev of events || []) {
    const client = ev.clients || {};
    if (!client.email) continue;
    try {
      await sendAvisEmail({
        toEmail: client.email.toLowerCase(),
        firstName: client.first_name || 'Client',
        eventType: ev.event_type,
        eventId: ev.id,
      });
      results.push({ event: ev.id, status: 'sent' });
    } catch (e) {
      results.push({ event: ev.id, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
