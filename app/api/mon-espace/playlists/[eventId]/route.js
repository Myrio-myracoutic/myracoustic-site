import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
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
  return NextResponse.json({ playlists });
}
