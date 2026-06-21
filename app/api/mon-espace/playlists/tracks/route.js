import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// POST /api/mon-espace/playlists/tracks
// Ajoute un morceau à une playlist
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await request.json();
  const { playlist_id, title, artist, note, tidal_id, position,
          album, deezer_id, preview_url, cover_url } = body;

  if (!playlist_id || !title?.trim() || !artist?.trim()) {
    return NextResponse.json({ error: 'playlist_id, title et artist requis' }, { status: 400 });
  }

  const supabase = getSupabase(token);

  // Calcule la position si non fournie (ajoute en fin)
  let pos = position;
  if (pos === undefined || pos === null) {
    const { count } = await supabase
      .from('playlist_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('playlist_id', playlist_id);
    pos = count || 0;
  }

  const { data, error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id,
      title:       title.trim(),
      artist:      artist.trim(),
      note:        note?.trim() || null,
      tidal_id:    tidal_id || null,
      album:       album?.trim() || null,
      deezer_id:   deezer_id || null,
      preview_url: preview_url || null,
      cover_url:   cover_url || null,
      position:    pos,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ track: data }, { status: 201 });
}
