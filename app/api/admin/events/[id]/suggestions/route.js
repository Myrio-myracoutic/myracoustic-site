import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*, event_guests(first_name, email)')
    .eq('event_id', id)
    .order('created_at');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ suggestions: data || [] });
}
