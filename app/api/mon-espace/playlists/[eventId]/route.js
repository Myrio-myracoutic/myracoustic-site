import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function ownsPlaylist(token, playlistId) {
  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();
  if (!client) return false;
  const { data: pl } = await supabaseAdmin
    .from('playlists')
    .select('id, events(client_id)')
    .eq('id', playlistId).single();
  return pl?.events?.client_id === client.id;
}

// GET /api/mon-espace/playlists/[eventId]
// Retourne toutes les playlists de l'événement avec leurs tracks
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      id, name, position,
      playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
    `)
    .eq('event_id', eventId)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Comptage des suggestions en attente par playlist
  const playlistIds = (playlists || []).map(p => p.id);
  let pendingByPlaylist = {};
  if (playlistIds.length > 0) {
    const { data: suggestions } = await supabase
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

// PATCH /api/mon-espace/playlists/[playlistId] — renommer une playlist
export async function PATCH(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  if (!(await ownsPlaylist(token, playlistId)))
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlists').update({ name: name.trim() }).eq('id', playlistId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist: data });
}

// DELETE /api/mon-espace/playlists/[playlistId] — supprimer une playlist
export async function DELETE(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  if (!(await ownsPlaylist(token, playlistId)))
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
