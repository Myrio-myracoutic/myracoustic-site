import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendDevisReminder } from '@/app/lib/send-devis-reminder';

// POST /api/admin/devis-reminder — relance manuelle : email « votre devis arrive à expiration »
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { proposalId } = await request.json();
  if (!proposalId) return Response.json({ error: 'proposalId manquant' }, { status: 400 });

  const { data: p, error } = await supabaseAdmin
    .from('devis_proposals')
    .select('token, valid_until, mariage_leads(prenom, email)')
    .eq('id', proposalId).maybeSingle();
  if (error || !p) return Response.json({ error: 'Proposition introuvable' }, { status: 404 });

  const lead = p.mariage_leads || {};
  if (!lead.email) return Response.json({ error: 'Aucun email pour ce contact.' }, { status: 400 });
  if (!p.token) return Response.json({ error: 'Lien de proposition indisponible.' }, { status: 400 });

  try {
    await sendDevisReminder({ email: lead.email.toLowerCase(), prenom: lead.prenom, token: p.token, validUntil: p.valid_until });
  } catch (e) {
    return Response.json({ error: 'Envoi échoué : ' + e.message }, { status: 500 });
  }
  // Marque l'envoi pour que le rappel automatique (pg_cron) ne relance pas une seconde fois le même jour.
  await supabaseAdmin.from('devis_proposals').update({ reminder_sent_at: new Date().toISOString() }).eq('id', proposalId);
  return Response.json({ ok: true });
}
