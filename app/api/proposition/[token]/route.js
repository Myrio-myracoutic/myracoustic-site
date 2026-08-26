import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';
import { installmentsAllowed } from '@/app/lib/devis-validity';
import { formuleInclusionsText } from '@/app/lib/formules';
import { discountEuros, discountActive } from '@/app/lib/discount';

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

  // Suivi de consultation : combien de fois le prospect revient sur sa proposition
  // (signal d'intérêt pour l'admin) — best-effort, une panne n'empêche jamais l'affichage.
  try {
    await supabaseAdmin.from('devis_proposals').update({
      viewed_count: (p.viewed_count || 0) + 1,
      first_viewed_at: p.first_viewed_at || new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
    }).eq('id', p.id);
  } catch (err) {
    console.error('proposal view tracking error:', err.message);
  }

  const lead = p.mariage_leads || {};
  // Réduction « du moment » : active seulement jusqu'à discount_until inclus (sinon prix plein).
  const dActive = discountActive(p.discount_until);
  const dEuros = dActive ? discountEuros(p.total, p.discount_type, p.discount_value) : 0;
  const netTotal = Number(p.total) - dEuros;
  const acompte = Math.round(netTotal * 0.6);
  const solde = netTotal - acompte;

  return NextResponse.json({
    proposal: {
      formule: p.formule, formule_name: p.formule_name, items: p.items, total: Number(p.total),
      net_total: netTotal,
      discount: dEuros > 0 ? { amount: dEuros, until: p.discount_until, type: p.discount_type, value: Number(p.discount_value) } : null,
      event_date: p.event_date, venue: p.venue, guests: p.guests, status: p.status,
      valid_until: p.valid_until, acompte, solde,
      installments_allowed: installmentsAllowed(p.event_date),
      firstName: lead.prenom || '',
      unavailable: proposalUnavailable(p),
    },
  });
}

// Une proposition refusée (marquée perdue en admin) ou expirée (délai de validité dépassé, jamais
// validée) ne doit plus pouvoir être acceptée par le client — ni affichée comme si de rien n'était.
function proposalUnavailable(p) {
  if (p.status === 'refusee') return 'refusee';
  if (p.status === 'proposee' && p.valid_until && p.valid_until < new Date().toISOString().slice(0, 10)) return 'expiree';
  return null;
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
  const unavailable = proposalUnavailable(p);
  if (unavailable === 'refusee') return NextResponse.json({ error: 'Cette proposition n\'est plus disponible.' }, { status: 400 });
  if (unavailable === 'expiree') return NextResponse.json({ error: 'Cette offre a expiré. Contactez-nous pour une nouvelle proposition.' }, { status: 400 });

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
  // La ligne de formule détaille ses inclusions dans la description (visible sur le devis Qonto)
  const formuleDesc = p.formule ? formuleInclusionsText(p.formule) : '';
  const items = (p.items || []).map(it => ({
    title: it.title,
    description: (it.source === 'formule' || /^Formule /i.test(it.title)) ? formuleDesc : '',
    priceHT: Number(it.price) / 1.2,
  }));
  // Réduction honorée uniquement si elle est encore active au moment de la validation.
  // Transmise à Qonto comme remise NATIVE (pourcentage) — surtout pas une ligne négative :
  // le endpoint Qonto filtre les lignes à prix <= 0. Un % s'applique pareil en HT et TTC,
  // donc la baisse en euros tombe juste.
  const dActive = discountActive(p.discount_until);
  const dEuros = dActive ? discountEuros(p.total, p.discount_type, p.discount_value) : 0;
  const discountPct = dEuros > 0 ? Number(((dEuros / Number(p.total)) * 100).toFixed(4)) : 0;
  const netTotal = Number(p.total) - dEuros;
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
        discountPct,
        note: `Formule ${p.formule_name || 'sur-mesure'} · validé en ligne par le client${dEuros > 0 ? ` · réduction du moment -${dEuros} €` : ''}${acompte2x ? ' · DEMANDE acompte en 2 fois' : ''}`,
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
    montant_final: netTotal,
  }).eq('id', p.id);
  await supabaseAdmin.from('mariage_leads').update({ status: 'gagne', client_id: clientId }).eq('id', p.lead_id);

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
          <p><strong>${lead.prenom} ${lead.nom}</strong> (${email}) a validé sa proposition (${netTotal} € TTC${dEuros > 0 ? ` — réduction du moment de ${dEuros} € appliquée` : ''}).</p>
          <p>${quoteId ? 'Un <strong>brouillon Qonto</strong> a été créé : ouvrez Qonto et envoyez-le pour signature.' : '⚠️ Brouillon Qonto NON créé automatiquement — à faire à la main.'}</p>
          <p>Adresse de facturation : ${adresse}, ${cp} ${ville}</p>
          ${acompte2x ? '<p style="color:#b8860b"><strong>⚠️ Le client demande à régler l\'acompte en 2 fois (sur 2 mois).</strong></p>' : ''}`,
      }),
    });
  } catch (err) { console.error('Notif Myrio error:', err.message); }

  return NextResponse.json({ ok: true, qontoDraft: !!quoteId });
}
