import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { proposalUnavailable } from '@/app/lib/devis-validity';

const NOTIF_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

// POST — le client demande la réactivation d'une proposition refusée/expirée, avec la date de
// mariage qu'il souhaite (la même qu'avant, ou une nouvelle). Ne réactive rien automatiquement :
// signale juste Myrio (email) pour qu'il recontacte et propose une alternative si le projet
// l'intéresse toujours. La réactivation reste une décision admin (voir devis-proposal).
export async function POST(request, { params }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body?.date) ? body.date : null;

  const { data: p } = await supabaseAdmin
    .from('devis_proposals')
    .select('id, lead_id, status, valid_until, formule_name, total, event_date, venue, reactivation_requested_at, mariage_leads(prenom, nom, email, tel)')
    .eq('token', token)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
  if (!proposalUnavailable(p)) {
    return NextResponse.json({ error: 'Cette proposition est encore active.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from('devis_proposals').update({
    reactivation_requested_at: now, reactivation_requested_date: date,
  }).eq('id', p.id);

  const lead = p.mariage_leads || {};
  const sameDate = date && date === p.event_date;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: NOTIF_EMAIL },
        to: [{ email: NOTIF_EMAIL }],
        subject: `Demande de réactivation — ${lead.prenom || ''} ${lead.nom || ''}`,
        htmlContent: `<h2>Un prospect veut reprendre l'échange</h2>
          <p><strong>${lead.prenom || ''} ${lead.nom || ''}</strong> (${lead.email || ''} · ${lead.tel || ''}) est revenu sur sa proposition
          <strong>${p.formule_name || 'sur-mesure'}</strong> (${p.total} € TTC) et a demandé sa réactivation.</p>
          <p>Offre initiale pour le ${fmtDate(p.event_date) || '—'}${p.venue ? ` à ${p.venue}` : ''}.</p>
          ${date
            ? (sameDate
              ? `<p>Il confirme vouloir garder la <strong>même date</strong> : ${fmtDate(date)}.</p>`
              : `<p>Il propose une <strong>nouvelle date</strong> : ${fmtDate(date)} (au lieu du ${fmtDate(p.event_date)}).</p>`)
            : `<p>Aucune date précisée.</p>`}
          <p>Il est toujours intéressé — proposez-lui une alternative (nouveau prix, nouvelle date) depuis le tableau de bord, ou rappelez-le directement.</p>
          <p><a href="${APP_URL}/admin/leads-mariage">Ouvrir le tableau de bord mariage →</a></p>`,
      }),
    });
  } catch (err) {
    console.error('Reactivation request notif error:', err.message);
  }

  return NextResponse.json({ ok: true });
}
