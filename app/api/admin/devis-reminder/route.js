import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendQuoteReminderEmail, urgencyForDaysLeft, daysUntil } from '@/app/lib/send-quote-reminder-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const STAGE_FOR_URGENCY = { j7: 1, j3: 2, j1: 3 };

// POST /api/admin/devis-reminder — relance manuelle : email « votre devis arrive à expiration »
// Palier calculé sur la vraie date d'expiration, comme le rappel automatique (jamais d'urgence inventée).
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { proposalId } = await request.json();
  if (!proposalId) return Response.json({ error: 'proposalId manquant' }, { status: 400 });

  const { data: p, error } = await supabaseAdmin
    .from('devis_proposals')
    .select('token, valid_until, reminder_stage, mariage_leads(prenom, email)')
    .eq('id', proposalId).maybeSingle();
  if (error || !p) return Response.json({ error: 'Proposition introuvable' }, { status: 404 });

  const lead = p.mariage_leads || {};
  if (!lead.email) return Response.json({ error: 'Aucun email pour ce contact.' }, { status: 400 });
  if (!p.token) return Response.json({ error: 'Lien de proposition indisponible.' }, { status: 400 });

  const daysLeft = p.valid_until ? daysUntil(p.valid_until) : null;
  const urgency = daysLeft === null ? 'j7' : (urgencyForDaysLeft(daysLeft) || 'j7');

  try {
    await sendQuoteReminderEmail({
      email: lead.email.toLowerCase(), prenom: lead.prenom,
      link: `${APP_URL}/proposition/${p.token}`, validUntil: p.valid_until, urgency,
      daysLeft: daysLeft === null ? 1 : daysLeft,
    });
  } catch (e) {
    return Response.json({ error: 'Envoi échoué : ' + e.message }, { status: 500 });
  }
  // Marque l'envoi pour que le rappel automatique (pg_cron) ne relance pas le même palier derrière.
  const stage = Math.max(p.reminder_stage || 0, STAGE_FOR_URGENCY[urgency]);
  await supabaseAdmin.from('devis_proposals').update({ reminder_stage: stage, reminder_sent_at: new Date().toISOString() }).eq('id', proposalId);
  return Response.json({ ok: true });
}
