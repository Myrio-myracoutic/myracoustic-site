import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const SENDER_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

async function sendEspaceOpenEmail(toEmail, firstName) {
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
      Votre date est réservée 🎉 Votre <strong style="color:#b8ef0b;">espace de mariage en ligne</strong> est désormais ouvert : playlists, invités, programme… tout est là pour préparer votre grand jour.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${APP_URL}/mon-espace/connexion" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Accéder à mon espace →</a>
      </td></tr>
    </table>
  </td></tr>
</table></td></tr></table>
</body></html>`;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER_EMAIL }, to: [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
      subject: 'Votre espace de mariage est ouvert 🎉', htmlContent: html,
    }),
  }).catch(() => {});
}

// POST /api/admin/open-espace — créer l'événement (espace mariage) depuis une proposition validée
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { proposalId } = await request.json();
  if (!proposalId) return Response.json({ error: 'Proposition manquante' }, { status: 400 });

  const { data: p } = await supabaseAdmin
    .from('devis_proposals').select('*, clients(first_name, email)').eq('id', proposalId).maybeSingle();
  if (!p) return Response.json({ error: 'Proposition introuvable' }, { status: 404 });
  if (!p.client_id) return Response.json({ error: 'Le client doit d\'abord valider la proposition' }, { status: 400 });

  // Déjà un événement pour ce client ?
  const { data: existingEvent } = await supabaseAdmin
    .from('events').select('id').eq('client_id', p.client_id).maybeSingle();
  if (existingEvent) return Response.json({ ok: true, alreadyOpen: true, eventId: existingEvent.id });

  const { data: ev, error: eErr } = await supabaseAdmin.from('events').insert({
    client_id: p.client_id, event_type: 'Mariage', event_date: p.event_date,
    venue: p.venue, guests: p.guests, formule: p.formule || null, status: 'confirme',
    // Relie l'événement au devis Qonto → l'onglet Facturation du client affiche le devis + factures
    qonto_quote_id: p.qonto_quote_id || null, qonto_quote_url: p.qonto_quote_url || null,
  }).select('id').single();
  if (eErr) return Response.json({ error: 'Création de l\'événement échouée : ' + eErr.message }, { status: 500 });

  const client = p.clients || {};
  if (client.email) { try { await sendEspaceOpenEmail(client.email, client.first_name); } catch {} }

  return Response.json({ ok: true, eventId: ev.id });
}
