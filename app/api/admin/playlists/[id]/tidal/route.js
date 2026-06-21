import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { deleteTidalPlaylist } from '@/app/lib/tidal';

/**
 * DELETE /api/admin/playlists/[id]/tidal
 * Supprime la playlist Tidal associée et efface tidal_playlist_id en base.
 */
export async function DELETE(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  const { data: pl, error: fetchErr } = await supabaseAdmin
    .from('playlists')
    .select('id, tidal_playlist_id')
    .eq('id', id)
    .single();

  if (fetchErr || !pl) return Response.json({ error: 'Playlist introuvable' }, { status: 404 });
  if (!pl.tidal_playlist_id) return Response.json({ error: 'Aucune playlist Tidal liée' }, { status: 400 });

  try {
    await deleteTidalPlaylist(pl.tidal_playlist_id);
  } catch (err) {
    // Playlist déjà supprimée côté Tidal → on nettoie quand même la base
    if (!err.message?.includes('404')) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  await supabaseAdmin
    .from('playlists')
    .update({ tidal_playlist_id: null })
    .eq('id', id);

  return Response.json({ ok: true });
}
