import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/mariage-leads — leads du formulaire de contact mariage
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data: leads, error } = await supabaseAdmin
    .from('mariage_leads')
    .select('id, created_at, prenom, nom, tel, email, event_date, guests, lieu, message, status, client_id')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Statut de la proposition liée (si elle existe)
  const { data: props } = await supabaseAdmin
    .from('devis_proposals')
    .select('lead_id, status, total');
  const byLead = {};
  for (const p of props || []) if (p.lead_id) byLead[p.lead_id] = p;

  const enriched = (leads || []).map(l => ({ ...l, proposal: byLead[l.id] || null }));
  return Response.json({ leads: enriched });
}

// DELETE /api/admin/mariage-leads — supprimer un lead
export async function DELETE(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await request.json();
  await supabaseAdmin.from('mariage_leads').delete().eq('id', id);
  return Response.json({ ok: true });
}
