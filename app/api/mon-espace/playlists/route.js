import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// POST /api/mon-espace/playlists — créer une playlist personnalisée
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId, name } = await request.json();
  if (!eventId || !name?.trim()) return NextResponse.json({ error: 'eventId et name requis' }, { status: 400 });

  const supabase = getSupabase(token);

  // Vérifier que l'événement appartient au client
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  const { data: ev } = await supabaseAdmin
    .from('events').select('id').eq('id', eventId).eq('client_id', client.id).single();
  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });

  // Position = max existant + 1
  const { data: existing } = await supabaseAdmin
    .from('playlists').select('position').eq('event_id', eventId).order('position', { ascending: false }).limit(1);
  const position = (existing?.[0]?.position ?? -1) + 1;

  const { data: playlist, error } = await supabaseAdmin
    .from('playlists')
    .insert({ event_id: eventId, name: name.trim(), position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist }, { status: 201 });
}
