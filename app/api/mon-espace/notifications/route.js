import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

// GET /api/mon-espace/notifications?eventId=xxx
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId requis' }, { status: 400 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: suggestions } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('playlist_id, playlists(name)')
    .eq('event_id', eventId)
    .eq('status', 'pending');

  const byPlaylist = {};
  for (const s of (suggestions || [])) {
    const id = s.playlist_id;
    if (!byPlaylist[id]) byPlaylist[id] = { playlistId: id, playlistName: s.playlists?.name || 'Playlist', count: 0 };
    byPlaylist[id].count++;
  }

  return NextResponse.json({ notifications: Object.values(byPlaylist) });
}
