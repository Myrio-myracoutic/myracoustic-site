import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyPlaylistAccess } from '@/app/lib/event-access';

async function getTrackAccess(token, trackId) {
  const { data: track } = await supabaseAdmin
    .from('playlist_tracks').select('playlist_id').eq('id', trackId).single();
  if (!track) return null;
  const access = await verifyPlaylistAccess(token, track.playlist_id);
  return access ? track : null;
}

// DELETE /api/mon-espace/playlists/tracks/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const track = await getTrackAccess(token, id);
  if (!track) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin.from('playlist_tracks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/mon-espace/playlists/tracks/[id] — note ou position
export async function PATCH(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const track = await getTrackAccess(token, id);
  if (!track) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const allowed = {};
  if (body.note     !== undefined) allowed.note     = body.note?.trim() || null;
  if (body.position !== undefined) allowed.position = body.position;

  if (!Object.keys(allowed).length)
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlist_tracks').update(allowed).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ track: data });
}
