import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyPlaylistAccess } from '@/app/lib/event-access';

/* GET — liste des suggestions pour une playlist */
export async function GET(request, { params }) {
  const { playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*, event_guests(first_name, email)')
    .eq('playlist_id', playlistId)
    .order('created_at');

  return NextResponse.json({ suggestions: data || [] });
}

/* POST — approuver toutes les suggestions pending d'une playlist */
export async function POST(request, { params }) {
  const { playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  if (body.action !== 'approve-all')
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

  const { data: pending } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*')
    .eq('playlist_id', playlistId)
    .eq('status', 'pending');

  if (!pending?.length) return NextResponse.json({ ok: true, added: 0 });

  const maxPos = await supabaseAdmin
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
  let pos = (maxPos.data?.[0]?.position ?? -1) + 1;

  const tracks = pending.map(s => ({
    playlist_id: playlistId,
    title: s.title, artist: s.artist, album: s.album,
    cover_url: s.cover_url, preview_url: s.preview_url,
    deezer_id: s.deezer_id, position: pos++,
  }));

  await supabaseAdmin.from('playlist_tracks').upsert(tracks, { onConflict: 'playlist_id,deezer_id', ignoreDuplicates: true });
  await supabaseAdmin.from('guest_song_suggestions').update({ status: 'approved' })
    .eq('playlist_id', playlistId).eq('status', 'pending');

  return NextResponse.json({ ok: true, added: pending.length });
}
