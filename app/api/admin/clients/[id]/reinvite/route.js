import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER      = 'contact@myracoustic.com';

async function sendInviteEmail(toEmail, firstName, inviteLink) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 24px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 16px;">
      Votre <strong style="color:#b8ef0b;">espace personnel Myracoustic</strong> vous attend.
      Cliquez ci-dessous pour accéder à votre espace et définir votre mot de passe.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Ce lien est valable 24 h. Si vous avez déjà défini un mot de passe, accédez directement à votre espace.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
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
      subject:   'Votre espace client Myracoustic est prêt',
      htmlContent: html,
    }),
  });
}

// POST /api/admin/clients/[id]/reinvite
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('email, first_name, auth_id')
    .eq('id', id)
    .single();

  if (!client) return Response.json({ error: 'Client introuvable' }, { status: 404 });

  // Garantir un compte auth (au cas où auth_id manquant) puis envoyer un mot de passe temporaire
  const { authId } = await ensureAuthUser(client.email, client.first_name, '');
  if (!authId) return Response.json({ error: 'Impossible de créer le compte' }, { status: 500 });

  if (authId !== client.auth_id) {
    await supabaseAdmin.from('clients').update({ auth_id: authId }).eq('id', id);
  }

  const tempPassword = await setupTempPassword(authId);
  await sendCredentialsEmail({
    toEmail: client.email.toLowerCase(),
    firstName: client.first_name,
    tempPassword,
    intro: `Voici vos identifiants pour accéder à votre <strong style="color:#b8ef0b;">espace personnel Myracoustic</strong>.`,
  });

  await supabaseAdmin
    .from('clients')
    .update({ invitation_sent_at: new Date().toISOString() })
    .eq('id', id);

  return Response.json({ ok: true });
}
