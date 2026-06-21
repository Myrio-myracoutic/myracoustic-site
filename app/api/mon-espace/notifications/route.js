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

// GET /api/mon-espace/notifications?eventId=xxx
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId requis' }, { status: 400 });

  // Vérifier appartenance
  const { data: ev } = await supabaseAdmin
    .from('events').select('id').eq('id', eventId).eq('client_id', client.id).single();
  if (!ev) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Suggestions en attente groupées par playlist
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
