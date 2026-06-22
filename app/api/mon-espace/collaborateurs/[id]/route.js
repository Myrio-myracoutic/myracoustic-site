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

export async function DELETE(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier que l'utilisateur est propriétaire de l'événement
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('event_id, events(client_id, clients(auth_id))')
    .eq('id', id).single();

  if (!collab) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (collab.events?.clients?.auth_id !== user.id)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  await supabaseAdmin.from('event_collaborators').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
