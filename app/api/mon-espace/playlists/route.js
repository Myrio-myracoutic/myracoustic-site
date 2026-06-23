import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

// POST /api/mon-espace/playlists — créer une playlist (normale ou surprise)
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId, name, is_surprise } = await request.json();
  if (!eventId || !name?.trim())
    return NextResponse.json({ error: 'eventId et name requis' }, { status: 400 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Seul un collaborateur peut créer une playlist surprise
  const isSurprise = !!is_surprise && access.isCollaborator;

  const { data: existing } = await supabaseAdmin
    .from('playlists').select('position').eq('event_id', eventId)
    .order('position', { ascending: false }).limit(1);
  const position = (existing?.[0]?.position ?? -1) + 1;

  const { data: playlist, error } = await supabaseAdmin
    .from('playlists')
    .insert({
      event_id: eventId,
      name: name.trim(),
      position,
      is_surprise: isSurprise,
      created_by_auth_id: access.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist }, { status: 201 });
}
