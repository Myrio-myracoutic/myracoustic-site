import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER  = 'contact@myracoustic.com';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function getOwnerClientId(token) {
  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin.from('clients').select('id').eq('auth_id', user.id).single();
  return data ? { clientId: data.id, email: user.email } : null;
}

// GET — liste des collaborateurs d'un événement
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const owner = await getOwnerClientId(token);
  if (!owner) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  const { data: ev } = await supabaseAdmin
    .from('events').select('id, client_id').eq('id', eventId).single();
  if (!ev || ev.client_id !== owner.clientId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: collabs } = await supabaseAdmin
    .from('event_collaborators')
    .select('id, email, first_name, last_name, role, invited_at, accepted_at, auth_id, can_see_billing')
    .eq('event_id', eventId)
    .order('invited_at');

  return NextResponse.json({ collaborateurs: collabs || [] });
}

// POST — inviter un collaborateur
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const owner = await getOwnerClientId(token);
  if (!owner) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId, email, firstName, lastName } = await request.json();
  if (!eventId || !email || !firstName)
    return NextResponse.json({ error: 'eventId, email et prénom requis' }, { status: 400 });

  // Vérifier propriété de l'événement
  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, client_id, event_type, clients(first_name)')
    .eq('id', eventId).single();
  if (!ev || ev.client_id !== owner.clientId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Upsert collaborateur
  const { data: collab, error } = await supabaseAdmin
    .from('event_collaborators')
    .upsert(
      { event_id: eventId, email: email.toLowerCase(), first_name: firstName, last_name: lastName || null },
      { onConflict: 'event_id,email', ignoreDuplicates: false }
    )
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Onboarding par mot de passe (les liens magiques sont consommés par les antivirus email)
  try {
    const { authId } = await ensureAuthUser(email, firstName, lastName || '');
    if (authId) {
      await supabaseAdmin.from('event_collaborators').update({ auth_id: authId }).eq('id', collab.id);
      const tempPassword = await setupTempPassword(authId);
      const ownerName = ev.clients?.first_name || 'Votre hôte';
      await sendCredentialsEmail({
        toEmail: email.toLowerCase(),
        firstName,
        tempPassword,
        intro: `<strong style="color:#b8ef0b;">${ownerName}</strong> vous invite à collaborer sur la gestion de son <strong>${ev.event_type || 'événement'}</strong> dans l'espace client Myracoustic. Voici vos identifiants pour accéder à l'espace.`,
      });
    }
  } catch (e) {
    console.error('Collab onboarding error:', e.message);
    return NextResponse.json({ error: 'Erreur lors de l\'invitation' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, collaborateur: collab });
}
