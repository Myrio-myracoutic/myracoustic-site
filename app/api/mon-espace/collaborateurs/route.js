import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

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

async function sendCollabInvite({ toEmail, firstName, inviteLink, ownerFirstName, eventType }) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 20px;">Vous avez été invité(e) à collaborer !</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 16px;">
      <strong style="color:#b8ef0b;">${ownerFirstName}</strong> vous invite à participer à la gestion de son
      <strong>${eventType || 'événement'}</strong> sur l'espace client Myracoustic.
    </p>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 32px;">
      En tant que collaborateur, vous aurez accès à l'ensemble de l'espace : programme, playlists, invités et suivi.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Accéder à l'espace →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">Ce lien est valable 24 h. Vous serez invité(e) à créer votre mot de passe lors de la première connexion.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:    { name: 'Myracoustic', email: SENDER },
      to:        [{ email: toEmail, name: firstName }],
      replyTo:   { email: SENDER, name: 'Myracoustic' },
      subject:   `${ownerFirstName} vous invite à collaborer sur son espace Myracoustic`,
      htmlContent: html,
    }),
  });
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
    .select('id, email, first_name, last_name, role, invited_at, accepted_at, auth_id')
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

  // Créer/inviter le compte Supabase
  let inviteLink = `${APP_URL}/mon-espace`;
  try {
    const { data: existingUser } = await supabaseAdmin.auth.admin
      .listUsers({ filter: `email.eq.${email.toLowerCase()}` }).catch(() => ({ data: null }));

    const userExists = existingUser?.users?.length > 0;

    if (userExists) {
      // Envoyer un lien de connexion
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
        options: { redirectTo: `${APP_URL}/mon-espace` },
      });
      if (link?.properties?.action_link) inviteLink = link.properties.action_link;
      // Mettre à jour auth_id
      await supabaseAdmin.from('event_collaborators')
        .update({ auth_id: existingUser.users[0].id })
        .eq('id', collab.id);
    } else {
      // Créer le compte et envoyer invitation
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: false,
        user_metadata: { first_name: firstName, last_name: lastName || '' },
      });
      if (!authErr) {
        const { data: link } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: email.toLowerCase(),
          options: { redirectTo: `${APP_URL}/auth/callback` },
        });
        if (link?.properties?.action_link) inviteLink = link.properties.action_link;
        await supabaseAdmin.from('event_collaborators')
          .update({ auth_id: authData.user.id })
          .eq('id', collab.id);
      }
    }
  } catch (e) {
    console.error('Collab auth error:', e.message);
  }

  // Envoyer l'email
  await sendCollabInvite({
    toEmail: email.toLowerCase(),
    firstName,
    inviteLink,
    ownerFirstName: ev.clients?.first_name || 'Votre hôte',
    eventType: ev.event_type,
  });

  return NextResponse.json({ ok: true, collaborateur: collab });
}
