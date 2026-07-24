import { NextResponse } from 'next/server';

const NOTIF_EMAIL = process.env.GOOGLE_CALENDAR_ID || 'contact@myracoustic.com';

/* Devis particulier généré en BROUILLON (infos manquantes : lieu, date ou
   distance) — le devis n'est PAS parti au client. Cet email prévient Myrio
   qu'un brouillon Qonto l'attend, à compléter puis envoyer à la main. */
export async function POST(request) {
  const body = await request.json();
  const { prenom, nom, email, tel, eventType, date, lieu, missing, total, quoteUrl } = body;

  if (!prenom || !nom || !email) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const lines = [
    ['Contact', `${prenom} ${nom}`],
    ['Email', email],
    tel && ['Téléphone', tel],
    ['Type d’événement', eventType || 'Non précisé'],
    ['Date souhaitée', date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non précisée'],
    ['Lieu', lieu || 'Non précisé'],
    ['À compléter', missing || 'infos manquantes'],
    total && ['Total estimé', total],
  ].filter(Boolean);

  const quoteBlock = quoteUrl
    ? `<p><strong>Devis Qonto (brouillon) :</strong> <a href="${quoteUrl}">${quoteUrl}</a><br>Complétez ${missing || 'les infos manquantes'} puis envoyez-le au client.</p>`
    : '<p>Le brouillon est disponible dans votre espace Qonto (onglet Devis).</p>';

  const htmlContent = `
    <h2>Devis particulier à finaliser</h2>
    <p>Un devis a été généré en <strong>brouillon</strong> car il manquait ${missing || 'des informations'}. Il n’a pas été envoyé au client.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${lines.map(([k, v]) => `<tr><td style="font-weight:bold;color:#555">${k}</td><td>${v}</td></tr>`).join('')}
    </table>
    ${quoteBlock}
  `;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic — Devis', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        replyTo: { email, name: `${prenom} ${nom}` },
        subject: `Devis à finaliser — ${prenom} ${nom}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur Brevo');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Brevo devis-a-finaliser error:', err.message);
    return NextResponse.json({ error: 'Erreur lors de l’envoi' }, { status: 500 });
  }
}
