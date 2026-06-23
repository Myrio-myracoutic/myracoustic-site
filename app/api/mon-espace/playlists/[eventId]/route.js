import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyPlaylistAccess } from '@/app/lib/event-access';

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
      id, name, position,
      playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
    `)
    .eq('event_id', eventId)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const playlistIds = (playlists || []).map(p => p.id);
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
    playlists: (playlists || []).map(p => ({
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

  const { error } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
