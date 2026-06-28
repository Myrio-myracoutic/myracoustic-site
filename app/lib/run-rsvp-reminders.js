import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendRsvpReminderEmail } from '@/app/lib/rsvp-reminder-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

/* Relance RSVP automatique : 1 seule relance, 7 jours après l'invitation,
   aux invités sans réponse, pour un événement à venir non annulé, si la relance auto est activée. */
export async function runRsvpReminders() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: guests, error } = await supabaseAdmin
    .from('event_guests')
    .select('id, email, first_name, token, created_at, events!inner(id, event_type, event_date, status, rsvp_reminder_enabled, clients(first_name))')
    .is('attending', null)
    .not('email', 'is', null)
    .is('rsvp_reminder_sent_at', null)
    .lte('created_at', sevenDaysAgo);

  if (error) return { sent: 0, error: error.message };

  const eligible = (guests || []).filter(g => {
    const ev = g.events;
    if (!ev) return false;
    if (ev.rsvp_reminder_enabled === false) return false;            // relance auto désactivée par le couple
    if (['annule', 'termine'].includes(ev.status)) return false;     // événement annulé / terminé
    if (!ev.event_date || ev.event_date < todayStr) return false;    // pas de relance pour un événement passé
    return true;
  });

  const results = [];
  for (const g of eligible) {
    try {
      await sendRsvpReminderEmail({
        toEmail: g.email,
        firstName: g.first_name,
        inviteLink: `${APP_URL}/invitation/${g.token}`,
        eventType: g.events.event_type,
        clientFirstName: g.events.clients?.first_name || 'Votre hôte',
      });
      await supabaseAdmin
        .from('event_guests')
        .update({ rsvp_reminder_sent_at: new Date().toISOString() })
        .eq('id', g.id);
      results.push({ guest: g.id, status: 'sent' });
    } catch (e) {
      results.push({ guest: g.id, status: 'error', error: e.message });
    }
  }

  return { sent: results.filter(r => r.status === 'sent').length, results };
}
