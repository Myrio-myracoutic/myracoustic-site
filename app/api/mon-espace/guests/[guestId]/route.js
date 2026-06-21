import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

async function getClient(token) {
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabaseAdmin.from('clients').select('id').eq('auth_id', user.id).single();
  return data;
}

async function ownsGuest(clientId, guestId) {
  const { data } = await supabaseAdmin
    .from('event_guests')
    .select('id, event_id, events(client_id)')
    .eq('id', guestId)
    .single();
  return data?.events?.client_id === clientId ? data : null;
}

/* PATCH — modifier playlists ou max_songs */
export async function PATCH(request, { params }) {
  const { guestId } = await params;
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  const client = await getClient(auth);
  if (!client) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const guest = await ownsGuest(client.id, guestId);
  if (!guest) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const updates = {};
  if (body.playlistIds !== undefined) updates.playlist_ids = body.playlistIds;
  if (body.maxSongs    !== undefined) updates.max_songs    = body.maxSongs;

  const { data, error } = await supabaseAdmin
    .from('event_guests').update(updates).eq('id', guestId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, guest: data });
}

/* DELETE — supprimer un invité */
export async function DELETE(request, { params }) {
  const { guestId } = await params;
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  const client = await getClient(auth);
  if (!client) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const guest = await ownsGuest(client.id, guestId);
  if (!guest) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  await supabaseAdmin.from('event_guests').delete().eq('id', guestId);
  return NextResponse.json({ ok: true });
}
