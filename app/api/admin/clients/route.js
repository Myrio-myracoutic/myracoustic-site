import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/clients — liste clients avec statut compte
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Clients + nb d'événements
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('*, events(id, status, event_type, event_date)')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Récupérer tous les utilisateurs auth pour croiser le statut d'activation
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const authMap = {};
  for (const u of (authData?.users || [])) {
    authMap[u.id] = {
      confirmed: !!u.email_confirmed_at,
      lastSignIn: u.last_sign_in_at || null,
    };
  }

  const enriched = (clients || []).map(c => ({
    ...c,
    auth_status: c.auth_id ? (authMap[c.auth_id] || { confirmed: false, lastSignIn: null }) : null,
  }));

  return Response.json({ clients: enriched });
}
