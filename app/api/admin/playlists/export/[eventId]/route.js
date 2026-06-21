import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/**
 * GET /api/admin/playlists/export/[eventId]
 *
 * Génère un fichier M3U pour Serato DJ.
 * Chaque playlist devient une section #EXTM3U avec les titres.
 * Les titres sans tidal_id sont inclus comme commentaires (référence manuelle).
 */
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { eventId } = await params;

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('event_type, event_date, clients(first_name, last_name)')
    .eq('id', eventId)
    .single();

  const { data: playlists } = await supabaseAdmin
    .from('playlists')
    .select('name, position, playlist_tracks(title, artist, album, note, position)')
    .eq('event_id', eventId)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (!playlists?.length) {
    return Response.json({ error: 'Aucune playlist' }, { status: 404 });
  }

  const clientName = ev
    ? `${ev.clients?.first_name || ''} ${ev.clients?.last_name || ''}`.trim()
    : 'Client';
  const eventDate = ev?.event_date
    ? new Date(ev.event_date + 'T12:00:00').toLocaleDateString('fr-FR')
    : '';

  const lines = ['#EXTM3U'];
  lines.push(`# Myracoustic — ${clientName} — ${ev?.event_type || ''} ${eventDate}`);
  lines.push(`# Exporté le ${new Date().toLocaleDateString('fr-FR')}`);
  lines.push('');

  for (const playlist of playlists) {
    lines.push(`# ═══ ${playlist.name.toUpperCase()} ═══`);
    const tracks = (playlist.playlist_tracks || []).sort((a, b) => a.position - b.position);
    if (!tracks.length) {
      lines.push('# (aucun morceau)');
    } else {
      for (const t of tracks) {
        lines.push(`#EXTINF:-1,${t.artist} - ${t.title}`);
        if (t.album) lines.push(`# Album : ${t.album}`);
        if (t.note)  lines.push(`# Note : ${t.note}`);
      }
    }
    lines.push('');
  }

  const filename = `myracoustic-${clientName.replace(/\s+/g, '-').toLowerCase()}-${eventDate.replace(/\//g, '-')}.m3u`;

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type':        'audio/x-mpegurl; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
