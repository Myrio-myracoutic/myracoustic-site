import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const NOTIF_EMAIL = 'contact@myracoustic.com';

const RAISONS = {
  prix: 'Le budget ne correspondait pas',
  autre_prestataire: 'A choisi un autre prestataire',
  annule: 'Le mariage est annulé ou reporté',
  sans_suite: "N'a plus besoin de prestataire",
  autre: 'Autre raison',
};

// POST — le client refuse la proposition et explique pourquoi (amélioration du service).
// Verrouille la proposition (status refusee) et le lead (status perdu), comme le ferait
// l'admin manuellement — voir devis_proposals.status / mariage_leads.status.
export async function POST(request, { params }) {
  const { token } = await params;
  const { raison, commentaire } = await request.json();
  if (!raison || !RAISONS[raison]) {
    return NextResponse.json({ error: 'Merci de choisir une raison.' }, { status: 400 });
  }

  const { data: p } = await supabaseAdmin
    .from('devis_proposals').select('id, status, lead_id, mariage_leads(prenom, nom, email)')
    .eq('token', token).maybeSingle();
  if (!p) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
  if (p.status === 'validee') return NextResponse.json({ error: 'Cette proposition a déjà été acceptée.' }, { status: 400 });

  const { error: insertErr } = await supabaseAdmin.from('proposition_refus_feedback').insert({
    proposal_id: p.id, lead_id: p.lead_id,
    raison: RAISONS[raison], commentaire: commentaire?.trim() || null,
  });
  if (insertErr) return NextResponse.json({ error: 'Erreur d\'enregistrement, réessayez.' }, { status: 500 });

  if (p.status !== 'refusee') {
    await supabaseAdmin.from('devis_proposals').update({ status: 'refusee' }).eq('id', p.id);
    if (p.lead_id) await supabaseAdmin.from('mariage_leads').update({ status: 'perdu' }).eq('id', p.lead_id);
  }

  const lead = p.mariage_leads || {};
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        subject: `Proposition refusée — ${lead.prenom || ''} ${lead.nom || ''}`,
        htmlContent: `<h2>Un prospect a refusé sa proposition</h2>
          <p><strong>${lead.prenom || ''} ${lead.nom || ''}</strong> (${lead.email || ''})</p>
          <p>Raison : <strong>${RAISONS[raison]}</strong></p>
          ${commentaire?.trim() ? `<p>Commentaire : ${commentaire.trim()}</p>` : ''}`,
      }),
    });
  } catch (err) { console.error('Notif refus Myrio error:', err.message); }

  return NextResponse.json({ ok: true });
}
