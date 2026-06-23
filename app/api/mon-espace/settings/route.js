import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, getSupabaseClient } from '@/app/lib/event-access';

// GET — récupérer les infos du compte + billing
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  // Chercher en tant que client principal
  const { data: client } = await supabaseAdmin
    .from('clients').select('first_name, last_name, phone, email').eq('auth_id', user.id).single();

  // Sinon chercher en tant que collaborateur
  let collabInfo = null;
  if (!client && user) {
    const { data: collab } = await supabaseAdmin
      .from('event_collaborators')
      .select('first_name, last_name')
      .eq('auth_id', user.id)
      .single();
    if (collab) collabInfo = { ...collab, email: user.email, phone: '' };
  }

  const ev = eventId
    ? (await supabaseAdmin.from('events').select('billing_email').eq('id', eventId).single()).data
    : null;

  return NextResponse.json({
    account: client || collabInfo || { email: user.email, first_name: '', last_name: '', phone: '' },
    billingEmail: ev?.billing_email || '',
    isCollaborator: !client && !!collabInfo,
  });
}

// PATCH — mettre à jour le profil et/ou le billing email
export async function PATCH(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { firstName, lastName, phone, billingEmail, eventId } = await request.json();

  // Chercher si client principal ou collaborateur
  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();

  if (client) {
    // Propriétaire : met à jour clients
    if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
      const updates = {};
      if (firstName !== undefined) updates.first_name = firstName;
      if (lastName  !== undefined) updates.last_name  = lastName;
      if (phone     !== undefined) updates.phone       = phone;
      await supabaseAdmin.from('clients').update(updates).eq('auth_id', user.id);
    }
  } else {
    // Collaborateur : met à jour event_collaborators
    if (firstName !== undefined || lastName !== undefined) {
      const updates = {};
      if (firstName !== undefined) updates.first_name = firstName;
      if (lastName  !== undefined) updates.last_name  = lastName;
      await supabaseAdmin.from('event_collaborators').update(updates).eq('auth_id', user.id);
    }
  }

  // Billing email — vérifier accès à l'event
  if (billingEmail !== undefined && eventId) {
    const access = await verifyEventAccess(token, eventId);
    if (access) {
      await supabaseAdmin.from('events')
        .update({ billing_email: billingEmail || null })
        .eq('id', eventId);
    }
  }

  return NextResponse.json({ ok: true });
}
