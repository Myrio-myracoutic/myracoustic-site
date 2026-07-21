import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';
import { installmentsAllowed } from '@/app/lib/devis-validity';

const NOTIF_EMAIL = 'contact@myracoustic.com';

async function getProposal(token) {
  const { data } = await supabaseAdmin
    .from('devis_proposals')
    .select('*, mariage_leads(prenom, nom, email, tel)')
    .eq('token', token)
    .maybeSingle();
  return data;
}

// GET — consulter la proposition via son token (public, pas de compte)
export async function GET(_req, { params }) {
  const { token } = await params;
  const p = await getProposal(token);
  if (!p) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });

  const lead = p.mariage_leads || {};
  const acompte = Math.round(Number(p.total) * 0.6);
  const solde = Number(p.total) - acompte;

  return NextResponse.json({
    proposal: {
      formule: p.formule, formule_name: p.formule_name, items: p.items, total: Number(p.total),
      event_date: p.event_date, venue: p.venue, guests: p.guests, status: p.status,
      valid_until: p.valid_until, acompte, solde,
      installments_allowed: installmentsAllowed(p.event_date),
      firstName: lead.prenom || '',
    },
  });
}

// POST — valider : crée le compte + le brouillon Qonto
export async function POST(request, { params }) {
  const { token } = await params;
  const { adresse, cp, ville, acompte2x } = await request.json();
  if (!adresse?.trim() || !cp?.trim() || !ville?.trim()) {
    return NextResponse.json({ error: 'Adresse de facturation incomplète' }, { status: 400 });
  }

  const p = await getProposal(token);
  if (!p) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
  if (p.status === 'validee') return NextResponse.json({ ok: true, already: true });

  const lead = p.mariage_leads || {};
  const email = (lead.email || '').toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email du prospect manquant' }, { status: 400 });

  // 1. Créer le compte client MAINTENANT (à la validation, pas avant)
  const { authId, isNew } = await ensureAuthUser(email, lead.prenom, lead.nom);
  const { data: existingClient } = await supabaseAdmin
    .from('clients').select('id').eq('email', email).maybeSingle();
  let clientId = existingClient?.id;
  if (!clientId) {
    const { data: nc, error: cErr } = await supabaseAdmin.from('clients').insert({
      auth_id: authId, email, first_name: lead.prenom, last_name: lead.nom,
      phone: lead.tel || null, profil: 'particulier',
      adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(),
    }).select('id').single();
    if (cErr) return NextResponse.json({ error: 'Création client échouée : ' + cErr.message }, { status: 500 });
    clientId = nc.id;
  } else {
    await supabaseAdmin.from('clients').update({ adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim() }).eq('id', clientId);
  }

  // 2. Brouillon Qonto (même date de validité que la proposition)
  const origin = new URL(request.url).origin;
  const items = (p.items || []).map(it => ({ title: it.title, description: '', priceHT: Number(it.price) / 1.2 }));
  let quoteId = null, quoteUrl = null;
  try {
    const qRes = await fetch(`${origin}/api/qonto/devis`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft: true,
        expiryDate: p.valid_until || undefined,
        client: { type: 'individual', firstName: lead.prenom, lastName: lead.nom, email, phone: lead.tel || '', adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim() },
        event: { type: 'Mariage', date: p.event_date, lieu: p.venue, formule: p.formule },
        items,
        note: `Formule ${p.formule_name || 'sur-mesure'} · validé en ligne par le client${acompte2x ? ' · DEMANDE acompte en 2 fois' : ''}`,
      }),
    });
    const qData = await qRes.json();
    if (qRes.ok) { quoteId = qData.quoteId; quoteUrl = qData.quoteUrl; }
    else console.error('Qonto draft (token) error:', JSON.stringify(qData));
  } catch (err) { console.error('Qonto draft (token) fetch error:', err.message); }

  // 3. Mettre à jour la proposition + le lead + accès client
  await supabaseAdmin.from('devis_proposals').update({
    status: 'validee', client_id: clientId, adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(),
    acompte_2x: !!acompte2x, qonto_quote_id: quoteId, qonto_quote_url: quoteUrl, validated_at: new Date().toISOString(),
  }).eq('id', p.id);
  await supabaseAdmin.from('mariage_leads').update({ status: 'devis_valide', client_id: clientId }).eq('id', p.lead_id);

  try {
    if (isNew && authId) {
      const tempPassword = await setupTempPassword(authId);
      await sendCredentialsEmail({
        toEmail: email, firstName: lead.prenom, tempPassword,
        intro: `Merci d'avoir validé votre proposition ! Nous avons créé votre <strong style="color:#b8ef0b;">espace personnel</strong>. Vous recevrez très vite votre devis à signer par email ; en attendant, voici vos identifiants pour suivre votre mariage.`,
      });
    }
  } catch (err) { console.error('Credentials email error:', err.message); }

  // 4. Prévenir Myrio
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        subject: `Devis validé — ${lead.prenom} ${lead.nom} · à envoyer pour signature`,
        htmlContent: `<h2>Proposition validée par le client</h2>
          <p><strong>${lead.prenom} ${lead.nom}</strong> (${email}) a validé sa proposition (${p.total} € TTC).</p>
          <p>${quoteId ? 'Un <strong>brouillon Qonto</strong> a été créé : ouvrez Qonto et envoyez-le pour signature.' : '⚠️ Brouillon Qonto NON créé automatiquement — à faire à la main.'}</p>
          <p>Adresse de facturation : ${adresse}, ${cp} ${ville}</p>
          ${acompte2x ? '<p style="color:#b8860b"><strong>⚠️ Le client demande à régler l\'acompte en 2 fois (sur 2 mois).</strong></p>' : ''}`,
      }),
    });
  } catch (err) { console.error('Notif Myrio error:', err.message); }

  return NextResponse.json({ ok: true, qontoDraft: !!quoteId });
}
