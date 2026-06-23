import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// PATCH /api/admin/programme/items/[id] — champs réservés admin
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const updates = {};
  if (body.secret_animation !== undefined) updates.secret_animation = body.secret_animation || null;
  if (body.secret_visible   !== undefined) updates.secret_visible   = !!body.secret_visible;

  if (!Object.keys(updates).length)
    return Response.json({ error: 'Aucun champ valide' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('event_programme').update(updates).eq('id', id).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ item: data });
}
