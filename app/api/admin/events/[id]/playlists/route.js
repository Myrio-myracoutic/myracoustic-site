import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  const [playlistsRes, eventRes, collabsRes] = await Promise.all([
    supabaseAdmin
      .from('playlists')
      .select(`
        id, name, position, tidal_playlist_id, is_surprise, hidden_from_collaborators, created_by_auth_id,
        playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
      `)
      .eq('event_id', id)
      .order('position')
      .order('position', { referencedTable: 'playlist_tracks' }),
    supabaseAdmin
      .from('events')
      .select('clients(auth_id, first_name, last_name)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('event_collaborators')
      .select('auth_id, first_name, last_name')
      .eq('event_id', id),
  ]);

  if (playlistsRes.error) return Response.json({ error: playlistsRes.error.message }, { status: 500 });

  // Construire la map auth_id → nom
  const nameMap = {};
  const client = eventRes.data?.clients;
  if (client?.auth_id) nameMap[client.auth_id] = `${client.first_name} ${client.last_name || ''}`.trim();
  for (const c of collabsRes.data || []) {
    if (c.auth_id) nameMap[c.auth_id] = `${c.first_name} ${c.last_name || ''}`.trim();
  }

  const playlists = (playlistsRes.data || []).map(p => ({
    ...p,
    created_by_name: p.created_by_auth_id ? (nameMap[p.created_by_auth_id] || null) : null,
  }));

  return Response.json({ playlists });
}
