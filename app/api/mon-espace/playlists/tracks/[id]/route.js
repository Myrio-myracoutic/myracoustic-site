import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// DELETE /api/mon-espace/playlists/tracks/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { error } = await supabase.from('playlist_tracks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/mon-espace/playlists/tracks/[id]
// Met à jour note ou position
export async function PATCH(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await request.json();
  const allowed = {};
  if (body.note     !== undefined) allowed.note     = body.note?.trim() || null;
  if (body.position !== undefined) allowed.position = body.position;

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from('playlist_tracks')
    .update(allowed)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ track: data });
}
