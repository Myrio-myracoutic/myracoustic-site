import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendQuoteReminderEmail, urgencyForDaysLeft, daysUntil } from '@/app/lib/send-quote-reminder-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const STAGE_FOR_URGENCY = { j7: 1, j3: 2, j1: 3 };

/* Rappel automatique avant expiration d'une proposition de devis (status 'proposee') :
   3 paliers honnêtes basés sur la vraie date d'expiration — J-7, J-3, J-1 — jamais
   plus d'un envoi par exécution et par proposition. reminder_stage (+ reminder_sent_at)
   est remis à 0/null dès que valid_until est recalculé (nouvelle proposition, report
   de date, réduction du moment) — voir devis-discount et devis-proposal. */
export async function runDevisReminders() {
  const { data: proposals, error } = await supabaseAdmin
    .from('devis_proposals')
    .select('id, token, valid_until, reminder_stage, mariage_leads(prenom, email)')
    .eq('status', 'proposee')
    .lt('reminder_stage', 3);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const p of proposals || []) {
    const lead = p.mariage_leads || {};
    if (!lead.email || !p.token || !p.valid_until) continue;

    const daysLeft = daysUntil(p.valid_until);
    if (daysLeft < 0) continue; // déjà expiré, plus aucun rappel utile

    const urgency = urgencyForDaysLeft(daysLeft);
    const stage = STAGE_FOR_URGENCY[urgency];
    if (!urgency || stage <= p.reminder_stage) continue; // rien à envoyer pour l'instant / déjà fait

    try {
      await sendQuoteReminderEmail({
        email: lead.email.toLowerCase(),
        prenom: lead.prenom,
        link: `${APP_URL}/proposition/${p.token}`,
        validUntil: p.valid_until,
        urgency,
        daysLeft,
      });
      await supabaseAdmin
        .from('devis_proposals')
        .update({ reminder_stage: stage, reminder_sent_at: new Date().toISOString() })
        .eq('id', p.id);
      results.push({ proposal: p.id, urgency, status: 'sent' });
    } catch (e) {
      results.push({ proposal: p.id, urgency, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
