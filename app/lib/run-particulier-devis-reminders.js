import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendQuoteReminderEmail, urgencyForDaysLeft, daysUntil } from '@/app/lib/send-quote-reminder-email';

const STAGE_FOR_URGENCY = { j7: 1, j3: 2, j1: 3 };

/* Équivalent particulier (et pro ciblé) de runDevisReminders() — mêmes paliers honnêtes
   J-7/J-3/J-1, basés sur la vraie expiry_date du devis Qonto. Ne concerne que les devis
   réellement envoyés (kind='auto_envoye') et encore en attente côté client
   (qonto_status='pending_approval') — jamais un brouillon jamais envoyé. */
export async function runParticulierDevisReminders() {
  const { data: quotes, error } = await supabaseAdmin
    .from('qonto_quotes_tracking')
    .select('id, client_email, client_first_name, qonto_quote_url, expiry_date, reminder_stage')
    .eq('kind', 'auto_envoye')
    .eq('qonto_status', 'pending_approval')
    .lt('reminder_stage', 3);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const q of quotes || []) {
    if (!q.client_email || !q.qonto_quote_url || !q.expiry_date) continue;

    const daysLeft = daysUntil(q.expiry_date);
    if (daysLeft < 0) continue;

    const urgency = urgencyForDaysLeft(daysLeft);
    const stage = STAGE_FOR_URGENCY[urgency];
    if (!urgency || stage <= q.reminder_stage) continue;

    try {
      await sendQuoteReminderEmail({
        email: q.client_email.toLowerCase(),
        prenom: q.client_first_name,
        link: q.qonto_quote_url,
        validUntil: q.expiry_date,
        urgency,
        daysLeft,
        linkLabel: 'Voir et valider mon devis →',
      });
      await supabaseAdmin
        .from('qonto_quotes_tracking')
        .update({ reminder_stage: stage, reminder_sent_at: new Date().toISOString() })
        .eq('id', q.id);
      results.push({ quote: q.id, urgency, status: 'sent' });
    } catch (e) {
      results.push({ quote: q.id, urgency, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
