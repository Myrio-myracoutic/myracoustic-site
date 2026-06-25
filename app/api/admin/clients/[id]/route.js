import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/clients/[id]
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*, events(id, event_type, event_date, venue, venue_cp, venue_city, status)')
    .eq('id', id)
    .single();

  if (error || !client) return Response.json({ error: 'Client introuvable' }, { status: 404 });

  let auth_status = null;
  if (client.auth_id) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(client.auth_id);
      if (user) {
        auth_status = {
          confirmed:  !!user.email_confirmed_at,
          lastSignIn: user.last_sign_in_at || null,
        };
      }
    } catch {}
  }

  return Response.json({ ...client, auth_status });
}

// PATCH /api/admin/clients/[id]
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const updates = {};
  const allowed = ['first_name', 'last_name', 'email', 'phone', 'profil', 'company_name', 'siret', 'adresse', 'cp', 'ville', 'billing_email'];
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key] || null;
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
