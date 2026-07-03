import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyPlaylistAccess } from '@/app/lib/event-access';

// POST /api/mon-espace/playlists/tracks/reorder
// Body : { playlist_id, orderedIds: [...] } → réécrit position = index (0,1,2…)
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { playlist_id, orderedIds } = await request.json();

  if (!playlist_id || !Array.isArray(orderedIds) || orderedIds.length === 0)
    return NextResponse.json({ error: 'playlist_id et orderedIds requis' }, { status: 400 });

  const access = await verifyPlaylistAccess(token, playlist_id);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin.rpc('reorder_playlist_tracks', {
    p_playlist_id: playlist_id,
    p_ids:         orderedIds,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
