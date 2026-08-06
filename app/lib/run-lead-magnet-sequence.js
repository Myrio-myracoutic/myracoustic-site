import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendLeadMagnetSequenceEmail } from './send-lead-magnet-sequence-email';
import { SEQUENCE_EMAILS } from './lead-magnet-sequence-data';

const STEP_DELAY_DAYS = 3;
const TOTAL_STEPS = SEQUENCE_EMAILS.length;

/* Envoie le prochain email dû pour chaque contact ayant téléchargé le guide DJ
   mariage — 5 emails espacés de 3 jours, jamais relancé après le 5e (sequence_next_at
   repose à null) ni si la personne s'est désinscrite (sequence_stopped_at posé). */
export async function runLeadMagnetSequence() {
  const { data: rows, error } = await supabaseAdmin
    .from('lead_magnet_signups')
    .select('id, email, first_name, sequence_step')
    .is('sequence_stopped_at', null)
    .lt('sequence_step', TOTAL_STEPS)
    .lte('sequence_next_at', new Date().toISOString());

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const row of rows || []) {
    const nextStep = row.sequence_step + 1;
    try {
      await sendLeadMagnetSequenceEmail({
        toEmail: row.email,
        firstName: row.first_name,
        step: nextStep,
        id: row.id,
      });

      const isLast = nextStep >= TOTAL_STEPS;
      const nextAt = isLast ? null : new Date(Date.now() + STEP_DELAY_DAYS * 86400000).toISOString();
      await supabaseAdmin
        .from('lead_magnet_signups')
        .update({ sequence_step: nextStep, sequence_next_at: nextAt })
        .eq('id', row.id);

      results.push({ id: row.id, step: nextStep, status: 'sent' });
    } catch (e) {
      results.push({ id: row.id, step: nextStep, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
