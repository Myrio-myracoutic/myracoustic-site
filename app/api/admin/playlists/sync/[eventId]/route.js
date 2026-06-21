import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import {
  resolveTrackId, createTidalPlaylist, addTracksToTidalPlaylist,
  removeTracksFromTidalPlaylist, getPlaylistItems, tidalPlaylistUrl,
} from '@/app/lib/tidal';

/**
 * POST /api/admin/playlists/sync/[eventId]
 *
 * Synchronise les playlists de l'événement vers le compte Tidal de Myrio :
 * - pour chaque titre, retrouve l'ID Tidal (par tidal_id déjà connu, sinon
 *   recherche « artiste titre » dans le catalogue Tidal v2)
 * - crée une playlist Tidal par playlist de l'événement, y ajoute les titres
 * - re-sync : réconcilie EN PLACE la playlist existante (ajoute les nouveaux
 *   titres, retire ceux supprimés) — même playlist, pas de doublon
 * - stocke tidal_playlist_id (playlist) et tidal_id (tracks résolus)
 */
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { eventId } = await params;

  const { data: ev, error: evErr } = await supabaseAdmin
    .from('events')
    .select('event_type, clients(first_name, last_name)')
    .eq('id', eventId)
    .single();
  if (evErr || !ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

  const clientName = `${ev.clients?.first_name || ''} ${ev.clients?.last_name || ''}`.trim();
  const eventLabel = ev.event_type || 'Événement';

  const { data: playlists, error: plErr } = await supabaseAdmin
    .from('playlists')
    .select('id, name, position, tidal_playlist_id, playlist_tracks(id, title, artist, tidal_id, position)')
    .eq('event_id', eventId)
    .order('position');
  if (plErr) return Response.json({ error: plErr.message }, { status: 500 });
  if (!playlists?.length) return Response.json({ error: 'Aucune playlist pour cet événement' }, { status: 400 });

  const results = [];

  for (const playlist of playlists) {
    const tracks = (playlist.playlist_tracks || []).sort((a, b) => a.position - b.position);
    const playlistName = `${clientName} — ${eventLabel} — ${playlist.name}`;

    try {
      // 1) Résout chaque titre en ID Tidal (réutilise tidal_id si déjà connu)
      const desired = [];   // IDs Tidal voulus, dans l'ordre
      let missing = 0;
      for (const t of tracks) {
        let tidalId = t.tidal_id;
        if (!tidalId) {
          try { tidalId = await resolveTrackId(`${t.artist} ${t.title}`.trim()); } catch { tidalId = null; }
        }
        if (tidalId) {
          desired.push(String(tidalId));
          if (String(tidalId) !== t.tidal_id) {
            await supabaseAdmin.from('playlist_tracks').update({ tidal_id: String(tidalId) }).eq('id', t.id);
          }
        } else {
          missing++;
        }
      }

      // 2) Récupère (ou crée) la playlist Tidal
      let tidalUuid = playlist.tidal_playlist_id;
      let current = [];   // [{ tidalId, itemId }]
      if (tidalUuid) {
        try {
          current = await getPlaylistItems(tidalUuid);
        } catch {
          // playlist disparue côté Tidal → on en recrée une
          tidalUuid = null;
        }
      }
      if (!tidalUuid) {
        tidalUuid = await createTidalPlaylist(playlistName);
        await supabaseAdmin.from('playlists').update({ tidal_playlist_id: tidalUuid }).eq('id', playlist.id);
      }

      // 3) Réconcilie en place : ajoute les nouveaux, retire les supprimés
      const currentIds = new Set(current.map(c => c.tidalId));
      const desiredSet = new Set(desired);
      const toAdd      = desired.filter(id => !currentIds.has(id));
      const toRemove   = current.filter(c => !desiredSet.has(c.tidalId));

      if (toRemove.length) await removeTracksFromTidalPlaylist(tidalUuid, toRemove);
      if (toAdd.length)    await addTracksToTidalPlaylist(tidalUuid, toAdd);

      results.push({
        playlist:      playlist.name,
        status:        'synced',
        total:         desired.length,
        added:         toAdd.length,
        removed:       toRemove.length,
        tracksMissing: missing,
        url:           tidalPlaylistUrl(tidalUuid),
      });
    } catch (err) {
      const msg = err.message === 'TOKEN_EXPIRED'
        ? 'Token Tidal expiré — reconnectez Tidal'
        : err.message;
      results.push({ playlist: playlist.name, status: 'error', error: msg });
    }
  }

  const hasError = results.some(r => r.status === 'error');
  return Response.json({ results }, { status: hasError ? 207 : 200 });
}
