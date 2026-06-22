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

async function getClientAndEvent(token, eventId) {
  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autorisé', status: 401 };

  // Chercher en tant que client principal
  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();

  if (client) {
    const { data: ev } = await supabaseAdmin
      .from('events').select('id, billing_email')
      .eq('id', eventId).eq('client_id', client.id).single();
    if (!ev) return { error: 'Événement introuvable', status: 404 };
    return { user, clientId: client.id, eventId: ev.id, billingEmail: ev.billing_email };
  }

  // Chercher en tant que collaborateur
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators').select('event_id')
    .eq('auth_id', user.id).eq('event_id', eventId).single();
  if (!collab) return { error: 'Non autorisé', status: 403 };

  const { data: ev } = await supabaseAdmin
    .from('events').select('id, billing_email').eq('id', eventId).single();
  return { user, clientId: null, eventId: ev.id, billingEmail: ev.billing_email };
}

// GET — récupérer les infos du compte + billing
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  const { data: client } = await supabaseAdmin
    .from('clients').select('first_name, last_name, phone, email').eq('auth_id', user.id).single();

  const ev = eventId
    ? (await supabaseAdmin.from('events').select('billing_email').eq('id', eventId).single()).data
    : null;

  return NextResponse.json({
    account: client || { email: user.email, first_name: '', last_name: '', phone: '' },
    billingEmail: ev?.billing_email || '',
  });
}

// PATCH — mettre à jour le profil et/ou le billing email
export async function PATCH(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { firstName, lastName, phone, billingEmail, eventId } = await request.json();

  // Mettre à jour le profil client
  if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName  !== undefined) updates.last_name  = lastName;
    if (phone     !== undefined) updates.phone       = phone;
    await supabaseAdmin.from('clients').update(updates).eq('auth_id', user.id);
  }

  // Mettre à jour l'email de facturation sur l'événement
  if (billingEmail !== undefined && eventId) {
    await supabaseAdmin.from('events')
      .update({ billing_email: billingEmail || null })
      .eq('id', eventId);
  }

  return NextResponse.json({ ok: true });
}
