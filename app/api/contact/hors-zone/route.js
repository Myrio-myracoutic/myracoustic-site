import { NextResponse } from 'next/server';

const NOTIF_EMAIL = process.env.GOOGLE_CALENDAR_ID || 'contact@myracoustic.com';

/* Demande hors zone (> 600 km) — le simulateur en ligne ne peut pas calculer
   de forfait déplacement, on bascule sur une demande de devis sur mesure. */
export async function POST(request) {
  const body = await request.json();
  const { profil, prenom, nom, email, tel, societe, eventType, date, lieu, km, items, totalPartiel, quoteUrl } = body;

  if (!prenom || !nom || !email || !tel) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const lines = [
    ['Profil', profil === 'professionnel' ? 'Professionnel' : 'Particulier'],
    societe && ['Société', societe],
    ['Contact', `${prenom} ${nom}`],
    ['Email', email],
    ['Téléphone', tel],
    ['Type d\'événement', eventType || 'Non précisé'],
    ['Date souhaitée', date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non précisée'],
    ['Lieu', lieu || 'Non précisé'],
    ['Distance estimée', `${km} km aller-retour (hors grille tarifaire)`],
  ].filter(Boolean);

  const itemsTable = Array.isArray(items) && items.length > 0 ? `
    <h3>Sélection du client</h3>
    <table cellpadding="6" style="border-collapse:collapse">
      ${items.map(([label, value]) => `<tr><td style="font-weight:bold;color:#555">${label}</td><td>${value}</td></tr>`).join('')}
    </table>
    ${totalPartiel ? `<p><strong>Total (hors frais de déplacement) : ${totalPartiel}</strong></p>` : ''}
  ` : '';

  const quoteBlock = quoteUrl
    ? `<p><strong>Devis Qonto (brouillon) :</strong> <a href="${quoteUrl}">${quoteUrl}</a><br>Ajoutez les frais de déplacement puis envoyez-le au client.</p>`
    : '';

  const htmlContent = `
    <h2>Nouvelle demande hors zone (> 600 km)</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${lines.map(([k, v]) => `<tr><td style="font-weight:bold;color:#555">${k}</td><td>${v}</td></tr>`).join('')}
    </table>
    ${itemsTable}
    ${quoteBlock}
  `;

  const confirmationHtml = `
    <p>Bonjour ${prenom},</p>
    <p>Votre événement se situe au-delà de notre zone de déplacement habituelle (600 km). Nous avons bien reçu votre sélection : un conseiller Myracoustic va l'étudier et vous recontactera sous 24 à 48 heures avec un devis sur mesure incluant les frais de déplacement.</p>
    <p>À très vite,<br>L'équipe Myracoustic</p>
  `;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic — Devis', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        replyTo: { email, name: `${prenom} ${nom}` },
        subject: `Demande hors zone (${km} km) — ${prenom} ${nom}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur Brevo');
    }

    const confirmRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
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
