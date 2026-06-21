import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { NextResponse } from 'next/server';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';
const SENDER_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

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
      Nous avons créé votre <strong style="color:#b8ef0b;">espace personnel Myracoustic</strong>
      pour suivre et gérer votre événement.
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 32px;">
      Cliquez ci-dessous pour accéder à votre espace et définir votre mot de passe.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Ce lien est valable 24 h.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0 0 4px;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER_EMAIL },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
      subject: 'Votre espace client Myracoustic est prêt',
      htmlContent: html,
    }),
  });
}

export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { email, firstName, lastName, phone, qontoQuoteId } = await request.json();
  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: 'Email, prénom et nom sont requis' }, { status: 400 });
  }

  // Vérifier si le client existe déjà
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('id, auth_id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà pour cet email' }, { status: 409 });
  }

  // Créer l'utilisateur auth Supabase
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase(),
    email_confirm: false,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  const authId = authErr ? null : authData.user.id;

  // Créer le client en base
  const { data: newClient, error: dbErr } = await supabaseAdmin
    .from('clients')
    .insert({
      auth_id: authId,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
    })
    .select('id')
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Lier un devis Qonto existant si fourni
  if (qontoQuoteId) {
    try {
      const qRes = await fetch(`${QONTO_BASE}/quotes/${qontoQuoteId}`, { headers: qHeaders() });
      if (qRes.ok) {
        const qData = await qRes.json();
        const q = qData.quote;
        await supabaseAdmin.from('events').insert({
          client_id: newClient.id,
          event_date: null,
          event_type: null,
          qonto_quote_id: qontoQuoteId,
          qonto_quote_url: q.quote_url || null,
          status: q.status === 'approved' ? 'accepte' : 'devis_envoye',
        });
      }
    } catch (e) {
      console.error('Erreur liaison devis Qonto:', e.message);
    }
  }

  // Envoyer l'invitation
  if (authId) {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.toLowerCase(),
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });
    if (linkData?.properties?.action_link) {
      await sendInviteEmail(email.toLowerCase(), firstName, linkData.properties.action_link);
    }
  }

  return NextResponse.json({ ok: true, clientId: newClient.id });
}
