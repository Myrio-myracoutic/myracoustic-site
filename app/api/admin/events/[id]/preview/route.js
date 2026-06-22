import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

// POST — génère un lien de connexion temporaire pour prévisualiser l'espace client
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('clients(email, first_name, auth_id)')
    .eq('id', id)
    .single();

  if (!ev?.clients?.email) {
    return Response.json({ error: 'Client introuvable' }, { status: 404 });
  }

  if (!ev.clients.auth_id) {
    return Response.json({ error: 'Ce client n\'a pas encore de compte' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: ev.clients.email,
    options: { redirectTo: `${APP_URL}/mon-espace` },
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ url: data.properties.action_link });
}
