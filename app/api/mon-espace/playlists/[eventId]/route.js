import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyPlaylistAccess } from '@/app/lib/event-access';

/**
 * Filtre les playlists selon le rôle et la visibilité choisie :
 * - is_surprise               → cachée aux MARIÉS (visible par tous les accès partagés + admin)
 * - hidden_from_collaborators → cachée aux ACCÈS PARTAGÉS (visible par les mariés + admin)
 * - Admin (via supabaseAdmin) : voit tout
 */
function filterPlaylists(playlists, access) {
  return playlists.filter(p => {
    if (access.isCollaborator) return !p.hidden_from_collaborators; // témoin : tout sauf « caché aux accès partagés »
    return !p.is_surprise;                                          // couple : tout sauf « caché aux mariés »
  });
}

// GET /api/mon-espace/playlists/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: playlists, error } = await supabaseAdmin
    .from('playlists')
    .select(`
      id, name, position, is_surprise, hidden_from_collaborators, created_by_auth_id,
      playlist_tracks ( id, title, artist, note, position, tidal_id, album, deezer_id, preview_url, cover_url )
    `)
    .eq('event_id', eventId)
    .order('position')
    .order('position', { referencedTable: 'playlist_tracks' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Appliquer le filtre surprise selon le rôle
  const visible = filterPlaylists(playlists || [], access);

  // Comptage des suggestions en attente (uniquement sur les playlists visibles)
  const playlistIds = visible.map(p => p.id);
  let pendingByPlaylist = {};
  if (playlistIds.length > 0) {
    const { data: suggestions } = await supabaseAdmin
      .from('guest_song_suggestions')
      .select('playlist_id, status')
      .in('playlist_id', playlistIds)
      .eq('status', 'pending');
    for (const s of (suggestions || [])) {
      pendingByPlaylist[s.playlist_id] = (pendingByPlaylist[s.playlist_id] || 0) + 1;
    }
  }

  return NextResponse.json({
    playlists: visible.map(p => ({
      ...p,
      pending_suggestions: pendingByPlaylist[p.id] || 0,
    })),
  });
}

// PATCH /api/mon-espace/playlists/[playlistId] — renommer et/ou changer la visibilité
export async function PATCH(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: pl } = await supabaseAdmin
    .from('playlists')
    .select('is_surprise, hidden_from_collaborators, created_by_auth_id')
    .eq('id', playlistId).single();
  if (!pl) return NextResponse.json({ error: 'Playlist introuvable' }, { status: 404 });

  // L'utilisateur doit pouvoir VOIR la playlist pour la modifier
  const canSee = access.isCollaborator ? !pl.hidden_from_collaborators : !pl.is_surprise;
  if (!canSee) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const updates = {};

  // Renommage — pour une playlist surprise, réservé au créateur
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    if (pl.is_surprise && pl.created_by_auth_id !== access.userId)
      return NextResponse.json({ error: 'Seul le créateur peut renommer une playlist surprise' }, { status: 403 });
    updates.name = body.name.trim();
  }

  // Visibilité — un accès partagé cache aux mariés (is_surprise) ;
  // les mariés cachent aux accès partagés (hidden_from_collaborators). Exclusifs.
  if (body.is_surprise !== undefined) {
    if (!access.isCollaborator)
      return NextResponse.json({ error: 'Seul un accès partagé peut cacher aux mariés' }, { status: 403 });
    updates.is_surprise = !!body.is_surprise;
    if (updates.is_surprise) updates.hidden_from_collaborators = false;
  }
  if (body.hidden_from_collaborators !== undefined) {
    if (access.isCollaborator)
      return NextResponse.json({ error: 'Seuls les mariés peuvent cacher aux accès partagés' }, { status: 403 });
    updates.hidden_from_collaborators = !!body.hidden_from_collaborators;
    if (updates.hidden_from_collaborators) updates.is_surprise = false;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlists').update(updates).eq('id', playlistId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist: data });
}

// DELETE /api/mon-espace/playlists/[playlistId] — supprimer
export async function DELETE(request, { params }) {
  const { eventId: playlistId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyPlaylistAccess(token, playlistId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Pour une playlist surprise, seul le créateur peut la supprimer
  const { data: pl } = await supabaseAdmin
    .from('playlists').select('is_surprise, created_by_auth_id').eq('id', playlistId).single();
  if (pl?.is_surprise && pl.created_by_auth_id !== access.userId)
    return NextResponse.json({ error: 'Seul le créateur peut supprimer une playlist surprise' }, { status: 403 });

  const { error } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
