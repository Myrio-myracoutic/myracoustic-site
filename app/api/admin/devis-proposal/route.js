import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureAuthUser, setupTempPassword, sendCredentialsEmail } from '@/app/lib/account-access';

const SENDER_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

async function sendProposalReadyEmail(toEmail, firstName) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 16px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 24px;">
      Suite à notre échange, votre <strong style="color:#b8ef0b;">proposition de devis</strong> vous attend dans votre espace personnel. Connectez-vous pour la consulter et la valider.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${APP_URL}/mon-espace/connexion" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Voir ma proposition →</a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Connectez-vous avec l'email et le mot de passe habituels de votre espace Myracoustic.</p>
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
      subject: 'Votre proposition de devis est prête — Myracoustic',
      htmlContent: html,
    }),
  }).catch(() => {});
}

// POST /api/admin/devis-proposal — créer une proposition depuis un lead
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { leadId, formule, formuleName, items, total, adminNote } = await request.json();
  if (!leadId || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Données manquantes' }, { status: 400 });
  }

  // 1. Récupérer le lead
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from('mariage_leads').select('*').eq('id', leadId).maybeSingle();
  if (leadErr || !lead) return Response.json({ error: 'Lead introuvable' }, { status: 404 });

  const email = lead.email.toLowerCase();

  // 2. Compte auth + ligne clients
  const { authId, isNew } = await ensureAuthUser(email, lead.prenom, lead.nom);

  const { data: existingClient } = await supabaseAdmin
    .from('clients').select('id').eq('email', email).maybeSingle();

  let clientId = existingClient?.id;
  if (!clientId) {
    const { data: newClient, error: cErr } = await supabaseAdmin
      .from('clients')
      .insert({
        auth_id: authId, email, first_name: lead.prenom, last_name: lead.nom,
        phone: lead.tel || null, profil: 'particulier',
      })
      .select('id').single();
    if (cErr) return Response.json({ error: 'Création client échouée : ' + cErr.message }, { status: 500 });
    clientId = newClient.id;
  }

  // 3. Créer la proposition
  const { data: proposal, error: pErr } = await supabaseAdmin
    .from('devis_proposals')
    .insert({
      lead_id: leadId, client_id: clientId,
      formule: formule || null, formule_name: formuleName || null,
      items, total: Number(total) || 0,
      event_date: lead.event_date, venue: lead.lieu, guests: lead.guests,
      admin_note: adminNote || null, status: 'proposee',
    })
    .select('id').single();
  if (pErr) return Response.json({ error: 'Création proposition échouée : ' + pErr.message }, { status: 500 });

  // 4. Mettre à jour le lead
  await supabaseAdmin.from('mariage_leads')
    .update({ status: 'devis_fait', client_id: clientId }).eq('id', leadId);

  // 5. Prévenir le client (accès si nouveau compte)
  try {
    if (isNew && authId) {
      const tempPassword = await setupTempPassword(authId);
      await sendCredentialsEmail({
        toEmail: email, firstName: lead.prenom, tempPassword,
        intro: `Suite à notre échange, nous avons préparé votre <strong style="color:#b8ef0b;">proposition de devis</strong> pour votre mariage. Connectez-vous à votre espace pour la consulter et la valider.`,
      });
    } else {
      await sendProposalReadyEmail(email, lead.prenom);
    }
  } catch (err) {
    console.error('Proposal email error:', err.message);
  }

  return Response.json({ ok: true, proposalId: proposal.id, isNew });
}
