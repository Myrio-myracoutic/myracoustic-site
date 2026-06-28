import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sortProgramme } from '@/app/lib/programme';

// GET /api/admin/events/[id]/programme
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('event_programme')
    .select('*')
    .eq('event_id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Noms des playlists liées (pour afficher le détail des associations Programme ↔ Playlist)
  const { data: playlists } = await supabaseAdmin
    .from('playlists')
    .select('id, name')
    .eq('event_id', id);

  return Response.json({ items: sortProgramme(data), playlists: playlists || [] });
}
