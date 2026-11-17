import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { resolveSource } from '@/app/lib/lead-source';
import { TYPES_EVENEMENT, BESOINS_PARTICULIER } from '@/app/lib/particulier-demande';
import { particulierDemandeConfirmationHtml, esc } from '@/app/lib/particulier-demande-email';

const NOTIF_EMAIL = process.env.GOOGLE_CALENDAR_ID || 'contact@myracoustic.com';

const texte = (v, max) => String(v ?? '').trim().slice(0, max);

// POST /api/contact/particulier — demande d'un particulier (/devis/particulier, 17/11).
// Rangée avec les demandes des pros (pro_contact_leads, structure « particulier ») : même fiche,
// même planning d'appel (CallSlotPicker kind="pro_contact"), onglet Particuliers de l'admin.
// Alerte à Myracoustic + confirmation au particulier.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const prenom = texte(body.prenom, 80);
  const nom = texte(body.nom, 80);
  const email = texte(body.email, 160).toLowerCase();
  const tel = texte(body.tel, 40);
  const lieu = texte(body.lieu, 200);
  const description = texte(body.message, 2000);
  const personnes = texte(body.personnes, 20);
  // Seules les valeurs proposées par le formulaire sont gardées (elles vont aussi dans l'email).
  const type = TYPES_EVENEMENT.includes(body.type) ? body.type : null;
  const besoins = Array.isArray(body.besoins) ? BESOINS_PARTICULIER.filter((b) => body.besoins.includes(b)) : [];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : null;

  if (!prenom || !nom || !tel || !/\S+@\S+\.\S+/.test(email) || !type || !personnes) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const { gclid, fbclid, oppref, utm_source, utm_medium, utm_campaign, sourceDeclared } = body;
  const source = resolveSource({ gclid, fbclid, oppref, utm_source, utm_medium, sourceDeclared });

  let leadId = null;
  try {
    const { data: lead, error } = await supabaseAdmin.from('pro_contact_leads').insert({
      prenom, nom, societe: null, email, tel, structure: 'particulier',
      besoins: besoins.length ? besoins : null, event_type: type, personnes, event_date: date,
      lieu: lieu || null, description: description || null,
      gclid: gclid || null, utm_source: utm_source || null, utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null, source,
    }).select('id').single();
    if (error) throw new Error(error.message);
    leadId = lead?.id || null;
  } catch (dbErr) {
    console.error('demande particulier insert error:', dbErr.message);
  }

  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Non précisée';
  const lines = [
    ['Contact', `${prenom} ${nom}`],
    ['Email', email],
    ['Téléphone', tel],
    ['Événement', type],
    ['Date', dateLabel],
    ['Invités', personnes],
    ['Lieu', lieu || 'Non précisé'],
    ['Envies', besoins.length ? besoins.join(', ') : 'Non précisées'],
  ];
  const htmlContent = `
    <h2>Nouvelle demande — Particulier</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${lines.map(([k, v]) => `<tr><td style="font-weight:bold;color:#555">${k}</td><td>${esc(v)}</td></tr>`).join('')}
    </table>
    ${description ? `<p><strong>Son projet :</strong><br>${esc(description).replace(/\n/g, '<br>')}</p>` : ''}
    ${leadId ? '' : '<p style="color:#b91c1c"><strong>Attention :</strong> la demande n’a pas pu être enregistrée dans les leads. Rappelez cette personne à partir de cet email.</p>'}
  `;

  const envoyer = (payload) => fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify(payload),
  });

  try {
    const res = await envoyer({
      sender: { name: 'Myracoustic — Devis', email: NOTIF_EMAIL },
      to: [{ email: NOTIF_EMAIL }],
      replyTo: { email, name: `${prenom} ${nom}` },
      subject: `Nouvelle demande particulier — ${prenom} ${nom}`,
      htmlContent,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur Brevo');
    }

    const confirmRes = await envoyer({
      sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
      to: [{ email, name: `${prenom} ${nom}` }],
      replyTo: { email: NOTIF_EMAIL, name: 'Myracoustic' },
      subject: 'Votre demande a bien été reçue — Myracoustic',
      htmlContent: particulierDemandeConfirmationHtml({ prenom, type, date, personnes, lieu, besoins }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      console.error('Brevo confirmation error:', err.message);
    }

    return NextResponse.json({ ok: true, leadId });
  } catch (err) {
    console.error('Brevo error:', err.message);
    // La demande est enregistrée : le particulier peut encore choisir son créneau d'appel.
    if (leadId) return NextResponse.json({ ok: true, leadId });
    return NextResponse.json({ error: 'Erreur lors de l’envoi' }, { status: 500 });
  }
}
