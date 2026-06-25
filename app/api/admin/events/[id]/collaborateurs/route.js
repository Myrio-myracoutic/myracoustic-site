import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';

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

  // Onboarding par mot de passe (les liens magiques sont consommés par les antivirus email)
  const { authId } = await ensureAuthUser(collab.email, collab.first_name, '');
  if (!authId) return Response.json({ error: 'Impossible de créer le compte' }, { status: 500 });

  await supabaseAdmin.from('event_collaborators').update({ auth_id: authId }).eq('id', collab.id);
  const tempPassword = await setupTempPassword(authId);
  const ownerName = ev?.clients?.first_name || 'Votre hôte';
  await sendCredentialsEmail({
    toEmail:      collab.email.toLowerCase(),
    firstName:    collab.first_name,
    tempPassword,
    intro: `<strong style="color:#b8ef0b;">${ownerName}</strong> vous invite à collaborer sur la gestion de son <strong>${ev?.event_type || 'événement'}</strong> dans l'espace client Myracoustic. Voici vos identifiants pour accéder à l'espace.`,
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
