import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { validUntil } from '@/app/lib/devis-validity';

const SENDER_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

async function sendProposalLink(toEmail, firstName, token, validUntilDate, isUpdate = false) {
  const link = `${APP_URL}/proposition/${token}`;
  const intro = isUpdate
    ? `Suite à votre demande, votre <strong style="color:#b8ef0b;">proposition de devis a été mise à jour</strong>. Cliquez ci-dessous pour découvrir la nouvelle version et la valider.`
    : `Suite à notre échange, votre <strong style="color:#b8ef0b;">proposition de devis</strong> est prête. Cliquez ci-dessous pour la découvrir — aucun compte à créer, tout est déjà là.`;
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 16px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 24px;">${intro}</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${link}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Voir ma proposition →</a>
      </td></tr>
    </table>
    ${validUntilDate ? `<p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;text-align:center;">Offre valable jusqu'au ${fmtDate(validUntilDate)}. Conservez cet email pour revenir à votre proposition quand vous le souhaitez.</p>` : ''}
  </td></tr>
</table></td></tr></table>
</body></html>`;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER_EMAIL },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
      subject: 'Votre proposition de devis Myracoustic',
      htmlContent: html,
    }),
  });
}

// POST /api/admin/devis-proposal — créer OU modifier une proposition (lien par token, pas de compte)
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { proposalId, leadId, formule, formuleName, items, total, adminNote } = await request.json();
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Données manquantes' }, { status: 400 });
  }

  // ── Modification d'une proposition existante ──
  if (proposalId) {
    const { data: existing } = await supabaseAdmin
      .from('devis_proposals').select('*, mariage_leads(prenom, email)').eq('id', proposalId).maybeSingle();
    if (!existing) return Response.json({ error: 'Proposition introuvable' }, { status: 404 });

    const validUntilDate = validUntil(existing.event_date);
    const { error: uErr } = await supabaseAdmin.from('devis_proposals').update({
      formule: formule || null, formule_name: formuleName || null,
      items, total: Number(total) || 0, admin_note: adminNote || null,
      status: 'proposee', valid_until: validUntilDate,
      qonto_quote_id: null, qonto_quote_url: null, validated_at: null,
    }).eq('id', proposalId);
    if (uErr) return Response.json({ error: 'Modification échouée : ' + uErr.message }, { status: 500 });

    const lead = existing.mariage_leads || {};
    if (lead.email) {
      try { await sendProposalLink(lead.email.toLowerCase(), lead.prenom, existing.token, validUntilDate, true); }
      catch (err) { console.error('Proposal link email error:', err.message); }
    }
    return Response.json({ ok: true, token: existing.token, updated: true });
  }

  // ── Création d'une nouvelle proposition ──
  if (!leadId) return Response.json({ error: 'Lead manquant' }, { status: 400 });
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from('mariage_leads').select('*').eq('id', leadId).maybeSingle();
  if (leadErr || !lead) return Response.json({ error: 'Lead introuvable' }, { status: 404 });

  const validUntilDate = validUntil(lead.event_date);

  const { data: proposal, error: pErr } = await supabaseAdmin
    .from('devis_proposals')
    .insert({
      lead_id: leadId,
      formule: formule || null, formule_name: formuleName || null,
      items, total: Number(total) || 0,
      event_date: lead.event_date, venue: lead.lieu, guests: lead.guests,
      admin_note: adminNote || null, status: 'proposee', valid_until: validUntilDate,
    })
    .select('id, token').single();
  if (pErr) return Response.json({ error: 'Création proposition échouée : ' + pErr.message }, { status: 500 });

  await supabaseAdmin.from('mariage_leads').update({ status: 'devis_fait' }).eq('id', leadId);

  try {
    await sendProposalLink(lead.email.toLowerCase(), lead.prenom, proposal.token, validUntilDate);
  } catch (err) {
    console.error('Proposal link email error:', err.message);
  }

  return Response.json({ ok: true, token: proposal.token });
}
