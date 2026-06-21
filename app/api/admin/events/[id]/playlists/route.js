import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  const { data: playlists, error } = await supabaseAdmin
    .from('playlists')
    .select(`
      id, name, position, tidal_playlist_id,
      playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
    `)
    .eq('event_id', id)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ playlists: playlists || [] });
}
