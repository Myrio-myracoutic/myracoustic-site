import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyWeddingOrgAccess } from '@/app/lib/event-access';

async function getGuestAccess(token, guestId) {
  const { data: guest } = await supabaseAdmin
    .from('event_guests').select('id, event_id').eq('id', guestId).single();
  if (!guest) return null;
  const access = await verifyEventAccess(token, guest.event_id);
  if (!access) return null;
  if (!(await verifyWeddingOrgAccess(guest.event_id))) return null;
  return guest;
}

/* PATCH — modifier prénom, email, téléphone, playlists ou max_songs */
export async function PATCH(request, { params }) {
  const { guestId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const guest = await getGuestAccess(token, guestId);
  if (!guest) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const updates = {};
  if (body.firstName   !== undefined) updates.first_name  = body.firstName;
  if (body.email       !== undefined) updates.email       = body.email ? body.email.toLowerCase() : null;
  if (body.phone       !== undefined) updates.phone       = body.phone || null;
  if (body.playlistIds !== undefined) updates.playlist_ids = body.playlistIds;
  if (body.maxSongs    !== undefined) updates.max_songs    = body.maxSongs;

  const { data, error } = await supabaseAdmin
    .from('event_guests').update(updates).eq('id', guestId).select().single();
  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre invité de cet événement.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, guest: data });
}

/* DELETE — supprimer un invité */
export async function DELETE(request, { params }) {
  const { guestId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const guest = await getGuestAccess(token, guestId);
  if (!guest) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  await supabaseAdmin.from('event_guests').delete().eq('id', guestId);
  return NextResponse.json({ ok: true });
}
