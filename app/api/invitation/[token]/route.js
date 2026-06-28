import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getEventGallery } from '@/app/lib/gallery';

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

  // Event page : titre toujours visible, contenu complet seulement si publié
  const { data: eventPage } = await supabaseAdmin
    .from('event_page')
    .select('*')
    .eq('event_id', guest.event_id)
    .maybeSingle();

  const page = eventPage?.is_published ? eventPage : null;

  // Infos pratiques : visibles dès qu'elles sont remplies, indépendamment de la publication du faire-part
  const practicalInfo = eventPage?.practical_info || null;

  // Module menu : exposé à l'invité uniquement s'il est activé par le couple
  const { data: menuConfig } = await supabaseAdmin
    .from('event_menu_config')
    .select('is_active, service_type, courses, ask_dietary, ask_cake, ask_drinks, drink_options, ask_comment, intro_text')
    .eq('event_id', guest.event_id)
    .maybeSingle();

  const menu = menuConfig?.is_active ? menuConfig : null;

  // Galerie : visible aux invités si Myracoustic l'a publiée (requête séparée, comme côté admin)
  const { data: evRow } = await supabaseAdmin
    .from('events').select('gallery_published').eq('id', guest.event_id).single();
  const gallery = evRow?.gallery_published ? await getEventGallery(guest.event_id) : [];

  return NextResponse.json({
    guest: {
      id: guest.id,
      first_name: guest.first_name,
      attending: guest.attending,
      adults_count: guest.adults_count,
      children_count: guest.children_count,
      max_songs: guest.max_songs,
      menu_response: guest.menu_response || {},
    },
    event: guest.events,
    eventTitle: eventPage?.title || null,
    playlists,
    page: page || null,
    practicalInfo,
    menu,
    gallery,
  });
}

/* PATCH — mettre à jour le RSVP */
export async function PATCH(request, { params }) {
  const { token } = await params;
  const guest = await getGuest(token);
  if (!guest) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });

  const { attending, adultsCount, childrenCount, menuResponse } = await request.json();
  const updates = { responded_at: new Date().toISOString() };
  if (attending     !== undefined) updates.attending      = attending;
  if (adultsCount   !== undefined) updates.adults_count   = adultsCount;
  if (childrenCount !== undefined) updates.children_count = childrenCount;
  if (menuResponse  !== undefined && menuResponse !== null && typeof menuResponse === 'object')
    updates.menu_response = menuResponse;

  await supabaseAdmin.from('event_guests').update(updates).eq('id', guest.id);
  return NextResponse.json({ ok: true });
}
