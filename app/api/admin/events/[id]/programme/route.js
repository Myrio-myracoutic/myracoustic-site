import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/events/[id]/programme
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('event_programme')
    .select('*')
    .eq('event_id', id)
    .order('time');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data || [] });
}
