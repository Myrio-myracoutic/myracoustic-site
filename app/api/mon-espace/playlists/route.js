import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

// POST /api/mon-espace/playlists — créer une playlist personnalisée
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId, name } = await request.json();
  if (!eventId || !name?.trim())
    return NextResponse.json({ error: 'eventId et name requis' }, { status: 400 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: existing } = await supabaseAdmin
    .from('playlists').select('position').eq('event_id', eventId)
    .order('position', { ascending: false }).limit(1);
  const position = (existing?.[0]?.position ?? -1) + 1;

  const { data: playlist, error } = await supabaseAdmin
    .from('playlists')
    .insert({ event_id: eventId, name: name.trim(), position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist }, { status: 201 });
}
