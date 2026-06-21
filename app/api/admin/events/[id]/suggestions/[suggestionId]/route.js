import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { suggestionId } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'

  const { data: suggestion } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();

  if (!suggestion) return Response.json({ error: 'Suggestion introuvable' }, { status: 404 });

  if (action === 'approve') {
    const { data: maxPos } = await supabaseAdmin
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', suggestion.playlist_id)
      .order('position', { ascending: false })
      .limit(1);

    const pos = (maxPos?.[0]?.position ?? -1) + 1;

    await supabaseAdmin.from('playlist_tracks').upsert(
      {
        playlist_id: suggestion.playlist_id,
        title: suggestion.title,
        artist: suggestion.artist,
        album: suggestion.album,
        cover_url: suggestion.cover_url,
        preview_url: suggestion.preview_url,
        deezer_id: suggestion.deezer_id,
        position: pos,
      },
      { onConflict: 'playlist_id,deezer_id', ignoreDuplicates: true }
    );

    await supabaseAdmin
      .from('guest_song_suggestions')
      .update({ status: 'approved' })
      .eq('id', suggestionId);
  } else {
    await supabaseAdmin
      .from('guest_song_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId);
  }

  return Response.json({ ok: true });
}
