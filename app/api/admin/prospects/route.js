import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/prospects — devis en cours de remplissage (non soumis)
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('devis_particulier_progress')
    .select('email, step, data, updated_at, last_relance_at, relance_clicked_at')
    .order('updated_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ prospects: data || [] });
}

// DELETE /api/admin/prospects — supprimer une entrée
export async function DELETE(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { email } = await request.json();
  await supabaseAdmin.from('devis_particulier_progress').delete().eq('email', email);
  return Response.json({ ok: true });
}
