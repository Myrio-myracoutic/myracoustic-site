import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getSupabaseClient } from '@/app/lib/event-access';

const NOTIF_EMAIL = 'contact@myracoustic.com';

async function resolveClient(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Non autorisé', status: 401 };
  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autorisé', status: 401 };
  const { data: client } = await supabaseAdmin
    .from('clients').select('id, first_name, last_name, email, phone, adresse, cp, ville')
    .eq('auth_id', user.id).maybeSingle();
  if (!client) return { error: 'Client introuvable', status: 404 };
  return { client };
}

// GET — dernière proposition de devis du client
export async function GET(request) {
  const { client, error, status } = await resolveClient(request);
  if (error) return NextResponse.json({ error }, { status });

  const { data: proposal } = await supabaseAdmin
    .from('devis_proposals')
    .select('id, formule, formule_name, items, total, event_date, venue, guests, status, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ proposal: proposal || null, client: { adresse: client.adresse, cp: client.cp, ville: client.ville } });
}

// POST — valider la proposition : adresse de facturation + création du brouillon Qonto
export async function POST(request) {
  const { client, error, status } = await resolveClient(request);
  if (error) return NextResponse.json({ error }, { status });

  const { proposalId, adresse, cp, ville } = await request.json();
  if (!proposalId || !adresse?.trim() || !cp?.trim() || !ville?.trim()) {
    return NextResponse.json({ error: 'Adresse de facturation incomplète' }, { status: 400 });
  }

  const { data: proposal } = await supabaseAdmin
    .from('devis_proposals').select('*').eq('id', proposalId).eq('client_id', client.id).maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
  if (proposal.status === 'validee') return NextResponse.json({ ok: true, already: true });

  // Créer le brouillon Qonto en réutilisant la route existante (draft:true)
  const origin = new URL(request.url).origin;
  const items = (proposal.items || []).map(it => ({
    title: it.title, description: '', priceHT: Number(it.price) / 1.2,
  }));

  let quoteId = null, quoteUrl = null;
  try {
    const qRes = await fetch(`${origin}/api/qonto/devis`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft: true,
        client: {
          type: 'individual', firstName: client.first_name, lastName: client.last_name,
          email: client.email, phone: client.phone || '',
          adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(),
        },
        event: { type: 'Mariage', date: proposal.event_date, lieu: proposal.venue, formule: proposal.formule },
        items,
        note: `Formule ${proposal.formule_name || 'sur-mesure'} · validé en ligne par le client`,
      }),
    });
    const qData = await qRes.json();
    if (qRes.ok) { quoteId = qData.quoteId; quoteUrl = qData.quoteUrl; }
    else console.error('Qonto draft (proposal) error:', JSON.stringify(qData));
  } catch (err) {
    console.error('Qonto draft (proposal) fetch error:', err.message);
  }

  // Mettre à jour la proposition + le client
  await supabaseAdmin.from('devis_proposals').update({
    status: 'validee', adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(),
    qonto_quote_id: quoteId, qonto_quote_url: quoteUrl, validated_at: new Date().toISOString(),
  }).eq('id', proposalId);

  const fill = {};
  if (!client.adresse) fill.adresse = adresse.trim();
  if (!client.cp) fill.cp = cp.trim();
  if (!client.ville) fill.ville = ville.trim();
  if (Object.keys(fill).length) await supabaseAdmin.from('clients').update(fill).eq('id', client.id);

  // Prévenir Myrio : un brouillon Qonto l'attend
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        subject: `Devis validé — ${client.first_name} ${client.last_name} · à envoyer pour signature`,
        htmlContent: `<h2>Un client a validé sa proposition de devis</h2>
          <p><strong>${client.first_name} ${client.last_name}</strong> (${client.email}) a validé sa proposition (${proposal.total} € TTC).</p>
          <p>${quoteId ? 'Un <strong>brouillon Qonto</strong> a été créé : ouvrez Qonto et envoyez-le pour signature.' : '⚠️ Le brouillon Qonto n\'a pas pu être créé automatiquement — à faire à la main dans Qonto.'}</p>
          <p>Adresse de facturation : ${adresse}, ${cp} ${ville}</p>`,
      }),
    });
  } catch (err) { console.error('Notif Myrio error:', err.message); }

  return NextResponse.json({ ok: true, qontoDraft: !!quoteId });
}
