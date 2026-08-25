import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const NOTIF_EMAIL = 'contact@myracoustic.com';

function fmtDate(d) {
  if (!d) return 'Non précisée';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}

async function sendEmail(payload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur Brevo');
  }
}

export async function POST(request) {
  const body = await request.json();
  const { prenom, nom, tel, email, date, guests, lieu, message, gclid, utm_source, utm_medium, utm_campaign, sourceDeclared } = body;
  // Détection auto (pub Google Ads) prioritaire sur le déclaratif — plus fiable qu'une réponse
  // de visiteur qui ne sait pas toujours distinguer une pub d'une recherche Google classique.
  const source = gclid ? 'google_ads' : (sourceDeclared || null);

  if (!prenom || !nom || !tel || !email) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  // 1. Enregistrer le lead (côté serveur, service role)
  // leadId permet au front d'enchaîner sur la réservation d'un créneau d'appel ;
  // reste null si l'insertion échoue (le front saute alors cette étape).
  let leadId = null;
  try {
    const { data: inserted } = await supabaseAdmin.from('mariage_leads').insert({
      prenom: prenom.trim(),
      nom: nom.trim(),
      tel: tel.trim(),
      email: email.trim().toLowerCase(),
      event_date: date || null,
      guests: guests ? parseInt(guests, 10) || null : null,
      lieu: lieu?.trim() || null,
      message: message?.trim() || null,
      gclid: gclid || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      source,
    }).select('id').single();
    leadId = inserted?.id || null;
  } catch (err) {
    console.error('Lead insert error:', err.message);
    // On continue quand même : la notification email est prioritaire pour ne pas perdre le lead.
  }

  // 2. Notification à Myrio + confirmation au client
  const lines = [
    ['Contact', `${prenom} ${nom}`],
    ['Téléphone', tel],
    ['Email', email],
    ['Date du mariage', fmtDate(date)],
    ['Nombre de personnes', guests || 'Non précisé'],
    ['Lieu', lieu || 'Non précisé'],
  ];
  const notifHtml = `
    <h2>Nouveau lead mariage — à rappeler sous 24h</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${lines.map(([k, v]) => `<tr><td style="font-weight:bold;color:#555">${k}</td><td>${v}</td></tr>`).join('')}
    </table>
    ${message ? `<p><strong>Message :</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
  `;
  const confirmHtml = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${prenom},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">Merci pour votre demande !</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 16px;">
      Nous avons bien reçu les informations pour votre <strong style="color:#b8ef0b;">mariage${date ? ` du ${fmtDate(date)}` : ''}</strong>.
    </p>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0;">
      Un conseiller Myracoustic vous <strong>rappelle sous 24h (jours ouvrés)</strong> pour échanger sur votre projet et construire ensemble la formule qui vous ressemble.
    </p>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  try {
    await sendEmail({
      sender: { name: 'Myracoustic — Lead mariage', email: NOTIF_EMAIL },
      to: [{ email: NOTIF_EMAIL }],
      replyTo: { email: email.trim(), name: `${prenom} ${nom}` },
      subject: `Nouveau lead mariage — ${prenom} ${nom}${date ? ` (${fmtDate(date)})` : ''}`,
      htmlContent: notifHtml,
    });
  } catch (err) {
    console.error('Brevo notif error:', err.message);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
  }

  // Confirmation client : si elle échoue, le lead est déjà pris en compte, on n'échoue pas.
  try {
    await sendEmail({
      sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
      to: [{ email: email.trim(), name: `${prenom} ${nom}` }],
      replyTo: { email: NOTIF_EMAIL, name: 'Myracoustic' },
      subject: 'Votre demande a bien été reçue — Myracoustic',
      htmlContent: confirmHtml,
    });
  } catch (err) {
    console.error('Brevo confirm error:', err.message);
  }

  return NextResponse.json({ ok: true, leadId });
}
