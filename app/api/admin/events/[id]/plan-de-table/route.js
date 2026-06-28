import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* GET — plan de table en lecture (admin) : tables + convives + invités */
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const [{ data: tables }, { data: persons }, { data: guests }] = await Promise.all([
    supabaseAdmin.from('event_tables').select('*').eq('event_id', id).order('position').order('created_at'),
    supabaseAdmin.from('event_persons').select('id, guest_id, kind, name, table_id, position').eq('event_id', id).order('position'),
    supabaseAdmin.from('event_guests').select('id, first_name').eq('event_id', id),
  ]);

  return Response.json({ tables: tables || [], persons: persons || [], guests: guests || [] });
}
