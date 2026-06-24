import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER  = 'contact@myracoustic.com';

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
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">Ce lien est valable 24 h.</p>
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
      sender:      { name: 'Myracoustic', email: SENDER },
      to:          [{ email: toEmail, name: firstName }],
      replyTo:     { email: SENDER, name: 'Myracoustic' },
      subject:     `${ownerFirstName} vous invite à collaborer sur son espace Myracoustic`,
      htmlContent: html,
    }),
  });
}

// GET — liste des collaborateurs avec infos auth
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data: collabs } = await supabaseAdmin
    .from('event_collaborators')
    .select('id, email, first_name, last_name, role, invited_at, accepted_at, auth_id, can_see_billing')
    .eq('event_id', id)
    .order('invited_at');

  if (!collabs?.length) return Response.json({ collaborateurs: [] });

  // Enrichir avec les données Supabase Auth
  const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const usersMap = Object.fromEntries((allUsers?.users || []).map(u => [u.id, u]));

  const enriched = collabs.map(c => {
    const authUser = c.auth_id ? usersMap[c.auth_id] : null;
    return {
      ...c,
      email_confirmed:  !!authUser?.email_confirmed_at,
      last_sign_in_at:  authUser?.last_sign_in_at || null,
    };
  });

  return Response.json({ collaborateurs: enriched });
}

// POST — ré-inviter un collaborateur
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const { collabId } = await req.json();

  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('id, email, first_name, auth_id')
    .eq('id', collabId)
    .eq('event_id', id)
    .single();

  if (!collab) return Response.json({ error: 'Collaborateur introuvable' }, { status: 404 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('event_type, clients(first_name)')
    .eq('id', id)
    .single();

  let inviteLink = `${APP_URL}/mon-espace`;

  if (collab.auth_id) {
    // Compte existant → magic link
    const { data: link } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: collab.email,
      options: { redirectTo: `${APP_URL}/mon-espace` },
    });
    if (link?.properties?.action_link) inviteLink = link.properties.action_link;
  } else {
    // Pas encore de compte — createUser d'abord, sinon chercher manuellement
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: collab.email.toLowerCase(),
      email_confirm: false,
      user_metadata: { first_name: collab.first_name },
    });
    if (!authErr && authData?.user) {
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: collab.email.toLowerCase(),
        options: { redirectTo: `${APP_URL}/auth/callback` },
      });
      if (link?.properties?.action_link) inviteLink = link.properties.action_link;
      await supabaseAdmin.from('event_collaborators').update({ auth_id: authData.user.id }).eq('id', collab.id);
    } else {
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = (allUsers?.users || []).find(u => u.email?.toLowerCase() === collab.email.toLowerCase());
      if (existing) {
        const { data: link } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: collab.email.toLowerCase(),
          options: { redirectTo: `${APP_URL}/mon-espace` },
        });
        if (link?.properties?.action_link) inviteLink = link.properties.action_link;
        await supabaseAdmin.from('event_collaborators').update({ auth_id: existing.id }).eq('id', collab.id);
      }
    }
  }

  await sendCollabInvite({
    toEmail:        collab.email,
    firstName:      collab.first_name,
    inviteLink,
    ownerFirstName: ev?.clients?.first_name || 'Votre hôte',
    eventType:      ev?.event_type,
  });

  await supabaseAdmin
    .from('event_collaborators')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', collab.id);

  return Response.json({ ok: true });
}

// DELETE — révoquer un accès partagé
export async function DELETE(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const collabId = searchParams.get('collabId');

  if (!collabId) return Response.json({ error: 'collabId requis' }, { status: 400 });

  await supabaseAdmin
    .from('event_collaborators')
    .delete()
    .eq('id', collabId)
    .eq('event_id', id);

  return Response.json({ ok: true });
}
