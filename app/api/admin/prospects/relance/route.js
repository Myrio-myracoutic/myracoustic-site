import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER  = 'contact@myracoustic.com';

function fmtDate(d) {
  if (!d) return null;
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// POST /api/admin/prospects/relance
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) return Response.json({ error: 'email requis' }, { status: 400 });

  const { data: prospect } = await supabaseAdmin
    .from('devis_particulier_progress')
    .select('email, step, data')
    .eq('email', email.toLowerCase())
    .single();

  if (!prospect) return Response.json({ error: 'Prospect introuvable' }, { status: 404 });

  const d         = prospect.data || {};
  const prenom    = d.prenom || 'vous';
  const eventType = d.eventType || 'votre événement';
  const date      = fmtDate(d.date);
  const trackLink = `${APP_URL}/api/track/relance?email=${encodeURIComponent(email.toLowerCase())}`;

  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 20px;">Bonjour ${prenom},</p>

    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 16px;">
      Vous avez commencé une demande de devis pour votre
      <strong style="color:#b8ef0b;">${eventType}</strong>${date ? ` du <strong style="color:#b8ef0b;">${date}</strong>` : ''} —
      et nous ne voudrions pas que ce moment vous échappe.
    </p>

    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 32px;">
      Il ne vous reste que quelques minutes pour finaliser votre demande et recevoir votre devis personnalisé.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 36px;text-align:center;">
        <a href="${trackLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Reprendre ma demande →
        </a>
      </td></tr>
    </table>

    <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.7;margin:0;">
      Une question avant de vous lancer ? Contactez-nous directement —
      nous sommes là pour vous accompagner.
    </p>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:      { name: 'Myracoustic', email: SENDER },
      to:          [{ email: email.toLowerCase(), name: prenom }],
      replyTo:     { email: SENDER, name: 'Myracoustic' },
      subject:     `Votre demande de devis est encore en attente, ${prenom}`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: 500 });
  }

  await supabaseAdmin
    .from('devis_particulier_progress')
    .update({ last_relance_at: new Date().toISOString() })
    .eq('email', email.toLowerCase());

  return Response.json({ ok: true });
}
