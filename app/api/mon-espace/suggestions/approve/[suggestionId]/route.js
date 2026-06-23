import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyPlaylistAccess } from '@/app/lib/event-access';

/* PATCH — approuver ou rejeter une suggestion */
export async function PATCH(request, { params }) {
  const { suggestionId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { action } = await request.json(); // 'approve' | 'reject'

  const { data: suggestion } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*, playlists(id, event_id)')
    .eq('id', suggestionId)
    .single();

  if (!suggestion) return NextResponse.json({ error: 'Suggestion introuvable' }, { status: 404 });

  const access = await verifyPlaylistAccess(token, suggestion.playlist_id);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  if (action === 'approve') {
    const { data: maxPos } = await supabaseAdmin
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', suggestion.playlist_id)
      .order('position', { ascending: false })
      .limit(1);

    const pos = (maxPos?.[0]?.position ?? -1) + 1;

    await supabaseAdmin.from('playlist_tracks').upsert({
      playlist_id: suggestion.playlist_id,
      title: suggestion.title, artist: suggestion.artist, album: suggestion.album,
      cover_url: suggestion.cover_url, preview_url: suggestion.preview_url,
      deezer_id: suggestion.deezer_id, position: pos,
    }, { onConflict: 'playlist_id,deezer_id', ignoreDuplicates: true });

    await supabaseAdmin.from('guest_song_suggestions')
      .update({ status: 'approved' }).eq('id', suggestionId);
  } else {
    await supabaseAdmin.from('guest_song_suggestions')
      .update({ status: 'rejected' }).eq('id', suggestionId);
  }

  return NextResponse.json({ ok: true });
}
