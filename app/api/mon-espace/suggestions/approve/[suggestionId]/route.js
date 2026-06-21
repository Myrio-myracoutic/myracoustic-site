import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

async function getClient(token) {
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabaseAdmin.from('clients').select('id').eq('auth_id', user.id).single();
  return data;
}

/* PATCH — approuver ou rejeter une suggestion */
export async function PATCH(request, { params }) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  const client = await getClient(auth);
  if (!client) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { action } = await request.json(); // 'approve' | 'reject'

  const { data: suggestion } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*, playlists(event_id, events(client_id))')
    .eq('id', params.suggestionId)
    .single();

  if (!suggestion || suggestion.playlists?.events?.client_id !== client.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  if (action === 'approve') {
    // Ajouter dans playlist_tracks
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
      .update({ status: 'approved' }).eq('id', params.suggestionId);
  } else {
    await supabaseAdmin.from('guest_song_suggestions')
      .update({ status: 'rejected' }).eq('id', params.suggestionId);
  }

  return NextResponse.json({ ok: true });
}
