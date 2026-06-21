import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

async function getGuest(token) {
  const { data } = await supabaseAdmin
    .from('event_guests')
    .select('*, events(id, event_type, event_date, venue_city, guests, clients(first_name, last_name))')
    .eq('token', token)
    .single();
  return data;
}

/* GET — infos invité + événement + playlists accessibles */
export async function GET(request, { params }) {
  const { token } = await params;
  const guest = await getGuest(token);
  if (!guest) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });

  // Playlists accessibles
  let playlists = [];
  if (guest.playlist_ids?.length) {
    const { data } = await supabaseAdmin
      .from('playlists')
      .select('id, name, position')
      .in('id', guest.playlist_ids)
      .order('position');
    playlists = data || [];
  }

  // Faire-part si publié
  const { data: page } = await supabaseAdmin
    .from('event_page')
    .select('*')
    .eq('event_id', guest.event_id)
    .eq('is_published', true)
    .maybeSingle();

  return NextResponse.json({
    guest: {
      id: guest.id,
      first_name: guest.first_name,
      attending: guest.attending,
      adults_count: guest.adults_count,
      children_count: guest.children_count,
      max_songs: guest.max_songs,
    },
    event: guest.events,
    playlists,
    page: page || null,
  });
}

/* PATCH — mettre à jour le RSVP */
export async function PATCH(request, { params }) {
  const { token } = await params;
  const guest = await getGuest(token);
  if (!guest) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });

  const { attending, adultsCount, childrenCount } = await request.json();
  const updates = { responded_at: new Date().toISOString() };
  if (attending     !== undefined) updates.attending      = attending;
  if (adultsCount   !== undefined) updates.adults_count   = adultsCount;
  if (childrenCount !== undefined) updates.children_count = childrenCount;

  await supabaseAdmin.from('event_guests').update(updates).eq('id', guest.id);
  return NextResponse.json({ ok: true });
}
