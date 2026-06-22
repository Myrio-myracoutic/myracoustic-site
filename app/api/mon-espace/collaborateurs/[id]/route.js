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

async function verifyOwner(token, collabId) {
  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('id, event_id, events(client_id, clients(auth_id))')
    .eq('id', collabId).single();
  if (!collab || collab.events?.clients?.auth_id !== user.id) return null;
  return collab;
}

// PATCH — modifier les permissions d'un collaborateur
export async function PATCH(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const collab = await verifyOwner(token, id);
  if (!collab) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { canSeeBilling } = await request.json();
  const updates = {};
  if (canSeeBilling !== undefined) updates.can_see_billing = canSeeBilling;

  const { data } = await supabaseAdmin
    .from('event_collaborators').update(updates).eq('id', id).select().single();
  return NextResponse.json({ ok: true, collaborateur: data });
}

// DELETE — retirer un collaborateur
export async function DELETE(request, { params }) {
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const collab = await verifyOwner(token, id);
  if (!collab) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  await supabaseAdmin.from('event_collaborators').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
