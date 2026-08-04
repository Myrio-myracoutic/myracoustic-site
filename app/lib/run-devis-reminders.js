import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendDevisReminder } from '@/app/lib/send-devis-reminder';

/* Rappel automatique J-1 avant expiration d'une proposition de devis (status 'proposee'),
   une seule fois par échéance — reminder_sent_at est remis à null dès que valid_until
   est recalculé (nouvelle proposition, report de date, réduction du moment). */
export async function runDevisReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: proposals, error } = await supabaseAdmin
    .from('devis_proposals')
    .select('id, token, valid_until, mariage_leads(prenom, email)')
    .eq('status', 'proposee')
    .eq('valid_until', tomorrowStr)
    .is('reminder_sent_at', null);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const p of proposals || []) {
    const lead = p.mariage_leads || {};
    if (!lead.email || !p.token) continue;
    try {
      await sendDevisReminder({
        email: lead.email.toLowerCase(),
        prenom: lead.prenom,
        token: p.token,
        validUntil: p.valid_until,
      });
      await supabaseAdmin
        .from('devis_proposals')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', p.id);
      results.push({ proposal: p.id, status: 'sent' });
    } catch (e) {
      results.push({ proposal: p.id, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
