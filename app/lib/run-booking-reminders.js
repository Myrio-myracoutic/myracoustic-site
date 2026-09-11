import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendBookingLinkForLead } from '@/app/lib/call-booking';

const DELAY_HOURS = 2;

/* Relance automatique pour un lead mariage qui n'a pas réservé de créneau d'appel dans les
   2h suivant sa demande (formulaire /devis/mariage-contact). Jusqu'ici, le seul filet était
   la promesse "on vous rappelle sous 24h" — sans relance si le lead ne décroche pas ou n'a
   jamais choisi de créneau. Réutilise sendBookingLinkForLead (déjà utilisé manuellement
   depuis l'admin), envoyée une seule fois par lead (booking_reminder_sent_at). */
export async function runMariageBookingReminders() {
  const cutoff = new Date(Date.now() - DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabaseAdmin
    .from('mariage_leads')
    .select('id, email')
    .is('call_scheduled_at', null)
    .is('client_id', null)
    .is('booking_reminder_sent_at', null)
    .neq('status', 'perdu')
    .lt('created_at', cutoff);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const lead of leads || []) {
    if (!lead.email) continue;
    const res = await sendBookingLinkForLead({ kind: 'mariage', refId: lead.id });
    if (res.ok) {
      await supabaseAdmin.from('mariage_leads').update({ booking_reminder_sent_at: new Date().toISOString() }).eq('id', lead.id);
      results.push({ lead: lead.id, status: 'sent' });
    } else {
      results.push({ lead: lead.id, status: 'error', error: res.error });
    }
  }
  return { sent: results.filter(r => r.status === 'sent').length, results };
}
