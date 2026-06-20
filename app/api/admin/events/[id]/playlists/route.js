import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req, { params }) {
  const cookieStore = await cookies();
  const adminToken  = cookieStore.get('admin_token')?.value;
  if (adminToken !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = adminSupabase();

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      id, name, position, tidal_playlist_id,
      playlist_tracks ( id, title, artist, note, position, tidal_id )
    `)
    .eq('event_id', id)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlists: playlists || [] });
}
