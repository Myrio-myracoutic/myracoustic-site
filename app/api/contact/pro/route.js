import { NextResponse } from 'next/server';

const NOTIF_EMAIL = process.env.GOOGLE_CALENDAR_ID || 'contact@myracoustic.com';

export async function POST(request) {
  const body = await request.json();
  const {
    prenom, nom, societe, email, tel, poste,
    type, personnes, date, budget, lieu, description,
  } = body;

  if (!prenom || !nom || !societe || !email || !tel || !type || !personnes) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const lines = [
    ['Société', societe],
    ['Contact', `${prenom} ${nom}${poste ? ` — ${poste}` : ''}`],
    ['Email', email],
    ['Téléphone', tel],
    ['Type d\'événement', type],
    ['Effectif estimé', personnes],
    ['Date souhaitée', date || 'Non précisée'],
    ['Budget indicatif', budget || 'Non précisé'],
    ['Lieu prévu', lieu || 'Non précisé'],
  ];

  const htmlContent = `
    <h2>Nouvelle demande de contact — Professionnel</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${lines.map(([k, v]) => `<tr><td style="font-weight:bold;color:#555">${k}</td><td>${v}</td></tr>`).join('')}
    </table>
    ${description ? `<p><strong>Description du projet :</strong><br>${description.replace(/\n/g, '<br>')}</p>` : ''}
  `;

  const confirmationHtml = `
    <p>Bonjour ${prenom},</p>
    <p>Nous avons bien reçu votre demande de contact pour <strong>${societe}</strong>. Un conseiller Myracoustic vous recontactera sous 24 à 48 heures.</p>
    <p>À très vite,<br>L'équipe Myracoustic</p>
  `;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Myracoustic — Devis', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        replyTo: { email, name: `${prenom} ${nom}` },
        subject: `Nouvelle demande pro — ${societe}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur Brevo');
    }

    const confirmRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
        to: [{ email, name: `${prenom} ${nom}` }],
        replyTo: { email: NOTIF_EMAIL, name: 'Myracoustic' },
        subject: 'Votre demande a bien été reçue — Myracoustic',
        htmlContent: confirmationHtml,
      }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      console.error('Brevo confirmation error:', err.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Brevo error:', err.message);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
  }
}
