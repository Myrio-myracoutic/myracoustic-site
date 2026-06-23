import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyPlaylistAccess } from '@/app/lib/event-access';

/**
 * Filtre les playlists selon le rôle de l'utilisateur :
 * - Propriétaire (couple) : ne voit JAMAIS les playlists surprises
 * - Collaborateur : voit uniquement les surprises qu'il a créées lui-même
 * - Admin (via supabaseAdmin) : voit tout
 */
function filterPlaylists(playlists, access) {
  return playlists.filter(p => {
    if (!p.is_surprise) return true;                              // Playlist normale → toujours visible
    if (!access.isCollaborator) return false;                    // Couple → jamais les surprises
    return p.created_by_auth_id === access.userId;               // Collaborateur → seulement ses créations
  });
}

// GET /api/mon-espace/playlists/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: playlists, error } = await supabaseAdmin
    .from('playlists')
    .select(`
      id, name, position, is_surprise, created_by_auth_id,
      playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
    `)
    .eq('event_id', eventId)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Appliquer le filtre surprise selon le rôle
  const visible = filterPlaylists(playlists || [], access);

  // Comptage des suggestions en attente (uniquement sur les playlists visibles)
  const playlistIds = visible.map(p => p.id);
  let pendingByPlaylist = {};
  if (playlistIds.length > 0) {
    const { data: suggestions } = await supabaseAdmin
      .from('guest_song_suggestions')
      .select('playlist_id, status')
      .in('playlist_id', playlistIds)
      .eq('status', 'pending');
    for (const s of (suggestions || [])) {
      pendingByPlaylist[s.playlist_id] = (pendingByPlaylist[s.playlist_id] || 0) + 1;
    }
  }

  return NextResponse.json({
    playlists: visible.map(p => ({
      ...p,
      pending_suggestions: pendingByPlaylist[p.id] || 0,
    })),
  });
}

// PATCH /api/mon-espace/playlists/[playlistId] — renommer
export async function PATCH(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Pour une playlist surprise, seul le créateur peut la modifier
  const { data: pl } = await supabaseAdmin
    .from('playlists').select('is_surprise, created_by_auth_id').eq('id', playlistId).single();
  if (pl?.is_surprise && pl.created_by_auth_id !== access.userId)
    return NextResponse.json({ error: 'Seul le créateur peut modifier une playlist surprise' }, { status: 403 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlists').update({ name: name.trim() }).eq('id', playlistId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist: data });
}

// DELETE /api/mon-espace/playlists/[playlistId] — supprimer
export async function DELETE(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Pour une playlist surprise, seul le créateur peut la supprimer
  const { data: pl } = await supabaseAdmin
    .from('playlists').select('is_surprise, created_by_auth_id').eq('id', playlistId).single();
  if (pl?.is_surprise && pl.created_by_auth_id !== access.userId)
    return NextResponse.json({ error: 'Seul le créateur peut supprimer une playlist surprise' }, { status: 403 });

  const { error } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
