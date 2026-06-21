import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function POST(request, { params }) {
  const guest = await supabaseAdmin
    .from('event_guests')
    .select('id, event_id, playlist_ids, max_songs')
    .eq('token', params.token)
    .single();

  if (!guest.data) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });
  const g = guest.data;

  const { playlistId, deezerId, title, artist, album, coverUrl, previewUrl } = await request.json();

  // Vérifier que la playlist est autorisée pour cet invité
  if (!g.playlist_ids?.includes(playlistId)) {
    return NextResponse.json({ error: 'Playlist non autorisée' }, { status: 403 });
  }

  // Vérifier la limite de chansons pour cet invité sur cette playlist
  const { count } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', g.id)
    .eq('playlist_id', playlistId);

  if (count >= g.max_songs) {
    return NextResponse.json({ error: `Limite de ${g.max_songs} chansons atteinte pour cette playlist` }, { status: 429 });
  }

  // Vérifier si la chanson est déjà dans la playlist (track existant)
  const { data: existing } = await supabaseAdmin
    .from('playlist_tracks')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('deezer_id', deezerId)
    .maybeSingle();

  // Vérifier si déjà suggérée par quelqu'un d'autre
  const { data: alreadySuggested } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('id, status')
    .eq('playlist_id', playlistId)
    .eq('deezer_id', deezerId)
    .maybeSingle();

  // Si déjà dans la playlist ou déjà suggérée → auto-approuver
  const autoApprove = !!existing || (alreadySuggested && alreadySuggested.status === 'approved');
  const status = autoApprove ? 'approved' : 'pending';

  if (alreadySuggested) {
    // Mettre à jour le statut de l'existante si nécessaire
    if (autoApprove && alreadySuggested.status !== 'approved') {
      await supabaseAdmin.from('guest_song_suggestions')
        .update({ status: 'approved' }).eq('id', alreadySuggested.id);
    }
    // Créer la suggestion pour cet invité (avec le même statut auto)
    // Si contrainte UNIQUE violée, c'est que cet invité a déjà proposé cette chanson
    const { error } = await supabaseAdmin.from('guest_song_suggestions').insert({
      guest_id: g.id, playlist_id: playlistId, event_id: g.event_id,
      deezer_id: deezerId, title, artist, album, cover_url: coverUrl, preview_url: previewUrl,
      status,
    });
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà proposé cette chanson' }, { status: 409 });
    }
  } else {
    const { error } = await supabaseAdmin.from('guest_song_suggestions').insert({
      guest_id: g.id, playlist_id: playlistId, event_id: g.event_id,
      deezer_id: deezerId, title, artist, album, cover_url: coverUrl, preview_url: previewUrl,
      status,
    });
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà proposé cette chanson' }, { status: 409 });
    }
  }

  // Si auto-approuvé et pas encore dans playlist_tracks → ajouter
  if (autoApprove && !existing) {
    const { data: maxPos } = await supabaseAdmin
      .from('playlist_tracks').select('position').eq('playlist_id', playlistId)
      .order('position', { ascending: false }).limit(1);
    const pos = (maxPos?.[0]?.position ?? -1) + 1;
    await supabaseAdmin.from('playlist_tracks').upsert({
      playlist_id: playlistId, deezer_id: deezerId, title, artist, album,
      cover_url: coverUrl, preview_url: previewUrl, position: pos,
    }, { onConflict: 'playlist_id,deezer_id', ignoreDuplicates: true });
  }

  return NextResponse.json({ ok: true, status });
}
