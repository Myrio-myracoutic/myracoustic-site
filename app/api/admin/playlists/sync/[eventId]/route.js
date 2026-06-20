import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { createTidalPlaylist, addTracksToTidalPlaylist, deleteTidalPlaylist } from '@/app/lib/tidal';

/**
 * POST /api/admin/playlists/sync/[eventId]
 *
 * Synchronise toutes les playlists de l'événement vers le compte Tidal de Myrio.
 * - Crée une playlist Tidal par playlist de l'événement (nommée "{client} — {type} — {nom}")
 * - Ajoute les titres qui ont un tidal_id
 * - Re-sync : supprime l'ancienne playlist Tidal et en crée une nouvelle
 * - Stocke le tidal_playlist_id dans la table playlists pour les re-syncs
 */
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { eventId } = await params;

  // Récupère l'événement + client
  const { data: ev, error: evErr } = await supabaseAdmin
    .from('events')
    .select('*, clients(first_name, last_name)')
    .eq('id', eventId)
    .single();

  if (evErr || !ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

  const clientName = `${ev.clients?.first_name || ''} ${ev.clients?.last_name || ''}`.trim();
  const eventLabel = ev.event_type || 'Événement';

  // Récupère toutes les playlists avec leurs tracks
  const { data: playlists, error: plErr } = await supabaseAdmin
    .from('playlists')
    .select('*, playlist_tracks(tidal_id, title, artist, position)')
    .eq('event_id', eventId)
    .order('position');

  if (plErr) return Response.json({ error: plErr.message }, { status: 500 });
  if (!playlists?.length) return Response.json({ error: 'Aucune playlist pour cet événement' }, { status: 400 });

  const results = [];

  for (const playlist of playlists) {
    const playlistName = `${clientName} — ${eventLabel} — ${playlist.name}`;

    try {
      // Supprime l'ancienne playlist Tidal si elle existe (re-sync)
      if (playlist.tidal_playlist_id) {
        await deleteTidalPlaylist(playlist.tidal_playlist_id).catch(() => {});
      }

      // Crée une nouvelle playlist Tidal
      const tidalUuid = await createTidalPlaylist(playlistName);

      // Ajoute les titres qui ont un tidal_id, dans l'ordre
      const trackIds = (playlist.playlist_tracks || [])
        .filter(t => t.tidal_id)
        .sort((a, b) => a.position - b.position)
        .map(t => Number(t.tidal_id));

      if (trackIds.length) {
        await addTracksToTidalPlaylist(tidalUuid, trackIds);
      }

      // Sauvegarde le tidal_playlist_id pour les re-syncs futurs
      await supabaseAdmin
        .from('playlists')
        .update({ tidal_playlist_id: tidalUuid })
        .eq('id', playlist.id);

      results.push({
        playlist: playlist.name,
        tidalUuid,
        tracksAdded: trackIds.length,
        tracksMissing: (playlist.playlist_tracks || []).filter(t => !t.tidal_id).length,
      });
    } catch (err) {
      results.push({ playlist: playlist.name, error: err.message });
    }
  }

  const hasError = results.some(r => r.error);
  return Response.json({ results }, { status: hasError ? 207 : 200 });
}
