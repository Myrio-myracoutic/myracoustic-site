import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

async function getClient(token) {
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabaseAdmin.from('clients').select('id').eq('auth_id', user.id).single();
  return data;
}

async function ownsPlaylist(clientId, playlistId) {
  const { data } = await supabaseAdmin
    .from('playlists')
    .select('id, event_id, events(client_id)')
    .eq('id', playlistId)
    .single();
  return data?.events?.client_id === clientId ? data : null;
}

/* GET — liste des suggestions pour une playlist */
export async function GET(request, { params }) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  const client = await getClient(auth);
  if (!client) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const pl = await ownsPlaylist(client.id, params.playlistId);
  if (!pl) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*, event_guests(first_name, email)')
    .eq('playlist_id', params.playlistId)
    .order('created_at');

  return NextResponse.json({ suggestions: data || [] });
}

/* POST — approuver toutes les suggestions pending d'une playlist */
export async function POST(request, { params }) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  const client = await getClient(auth);
  if (!client) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const pl = await ownsPlaylist(client.id, params.playlistId);
  if (!pl) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  if (body.action !== 'approve-all') return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

  // Récupérer toutes les suggestions pending
  const { data: pending } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*')
    .eq('playlist_id', params.playlistId)
    .eq('status', 'pending');

  if (!pending?.length) return NextResponse.json({ ok: true, added: 0 });

  // Insérer dans playlist_tracks (ignorer doublons)
  const maxPos = await supabaseAdmin
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', params.playlistId)
    .order('position', { ascending: false })
    .limit(1);
  let pos = (maxPos.data?.[0]?.position ?? -1) + 1;

  const tracks = pending.map(s => ({
    playlist_id: params.playlistId,
    title: s.title, artist: s.artist, album: s.album,
    cover_url: s.cover_url, preview_url: s.preview_url,
    deezer_id: s.deezer_id, position: pos++,
  }));

  await supabaseAdmin.from('playlist_tracks').upsert(tracks, { onConflict: 'playlist_id,deezer_id', ignoreDuplicates: true });
  await supabaseAdmin.from('guest_song_suggestions').update({ status: 'approved' })
    .eq('playlist_id', params.playlistId).eq('status', 'pending');

  return NextResponse.json({ ok: true, added: pending.length });
}
