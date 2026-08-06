import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/lead-magnet — contacts ayant téléchargé un guide (aimant public)
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('lead_magnet_signups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ signups: data || [] });
}

// DELETE /api/admin/lead-magnet — supprimer une fiche
export async function DELETE(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) return Response.json({ error: 'id manquant' }, { status: 400 });
  const { error } = await supabaseAdmin.from('lead_magnet_signups').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
