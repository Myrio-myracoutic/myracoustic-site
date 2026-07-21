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
  const { prenom, nom, tel, email, date, guests, lieu, message } = body;

  if (!prenom || !nom || !tel || !email) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  // 1. Enregistrer le lead (côté serveur, service role)
  try {
    await supabaseAdmin.from('mariage_leads').insert({
      prenom: prenom.trim(),
      nom: nom.trim(),
      tel: tel.trim(),
      email: email.trim().toLowerCase(),
      event_date: date || null,
      guests: guests ? parseInt(guests, 10) || null : null,
      lieu: lieu?.trim() || null,
      message: message?.trim() || null,
    });
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
  const confirmHtml = `
    <p>Bonjour ${prenom},</p>
    <p>Merci pour votre demande ! Nous avons bien reçu les informations pour votre mariage${date ? ` du <strong>${fmtDate(date)}</strong>` : ''}.</p>
    <p>Un conseiller Myracoustic vous <strong>rappelle sous 24h (jours ouvrés)</strong> pour échanger sur votre projet et construire ensemble la formule qui vous ressemble.</p>
    <p>À très vite,<br>Myrio &amp; l'équipe Myracoustic</p>
  `;

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

  return NextResponse.json({ ok: true });
}
