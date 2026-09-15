import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { MILESTONE_LABELS } from '@/app/lib/call-booking';

const ADMIN_EMAIL = 'contact@myracoustic.com';
const LEAD_DAYS = 14; // prévient Myracoustic 14 jours avant l'échéance indicative de l'étape

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function sendReminderEmail({ label, clientName, eventDate, targetDate }) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px;">
    <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px;">📅 Rendez-vous à prendre — ${label}</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.8;margin:0 0 8px;">
      Il est temps de prendre rendez-vous avec <strong style="color:#b8ef0b;">${clientName}</strong> pour : <strong>${label}</strong>.
    </p>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.8;margin:0;">
      Mariage prévu le ${fmtDate(eventDate)} · étape prévue vers le ${fmtDate(targetDate)}.
    </p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: 'Myracoustic' }],
      subject: `À prévoir : ${label} — ${clientName}`,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
}

/* Rappel interne (à Myracoustic, pas au client) pour ne pas oublier de prendre rendez-vous
   sur une étape du suivi post-signature (visite du lieu, point à 1 mois, derniers réglages) —
   voir supabase-migrations/2026-09-14_event_milestones.sql. Envoyé une seule fois par étape
   (admin_reminder_sent_at), quand target_date tombe dans les LEAD_DAYS jours à venir et
   qu'aucun appel n'est encore programmé. */
export async function runMilestoneAdminReminders() {
  const cutoff = new Date(Date.now() + LEAD_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: rows, error } = await supabaseAdmin
    .from('event_milestones')
    .select('id, milestone_type, target_date, events(event_date, clients(first_name, last_name))')
    .is('call_scheduled_at', null)
    .is('admin_reminder_sent_at', null)
    .not('target_date', 'is', null)
    .lte('target_date', cutoff);

  if (error) return { sent: 0, error: error.message };

  const results = [];
  for (const row of rows || []) {
    const client = row.events?.clients;
    const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client';
    const label = MILESTONE_LABELS[row.milestone_type] || row.milestone_type;
    try {
      await sendReminderEmail({ label, clientName, eventDate: row.events?.event_date, targetDate: row.target_date });
      await supabaseAdmin.from('event_milestones').update({ admin_reminder_sent_at: new Date().toISOString() }).eq('id', row.id);
      results.push({ id: row.id, status: 'sent' });
    } catch (err) {
      results.push({ id: row.id, status: 'error', error: err.message });
    }
  }
  return { sent: results.filter(r => r.status === 'sent').length, results };
}
