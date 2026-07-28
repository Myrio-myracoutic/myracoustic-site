import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { discountEuros } from '@/app/lib/discount';

const SENDER_EMAIL = 'contact@myracoustic.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}
const fmtPrice = (n) => Number(n).toLocaleString('fr-FR') + ' €';

async function sendDiscountEmail(toEmail, firstName, token, label, newTotal, until) {
  const link = `${APP_URL}/proposition/${token}`;
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 16px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 20px;">Votre projet nous tient à cœur. Pour vous accompagner, nous avons le plaisir de vous offrir un <strong style="color:#b8ef0b;">cadeau pour votre mariage</strong>&nbsp;:</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="background:rgba(184,239,11,0.1);border:1px solid rgba(184,239,11,0.3);border-radius:10px;padding:16px 28px;text-align:center;">
      <div style="color:#b8ef0b;font-size:22px;font-weight:800;">${label}</div>
      <div style="color:rgba(255,255,255,0.85);font-size:15px;margin-top:4px;">votre proposition passe à <strong>${fmtPrice(newTotal)}</strong></div>
    </td></tr></table>
    ${until ? `<p style="color:rgba(255,255,255,0.75);font-size:14px;line-height:1.7;margin:0 0 24px;text-align:center;">⏳ Cette offre est valable <strong style="color:#fff;">jusqu'au ${fmtDate(until)}</strong>. Passé ce délai, votre proposition revient à son tarif habituel.</p>` : ''}
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${link}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Profiter de ma réduction →</a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;margin:0;text-align:center;">Au plaisir de faire de votre grand jour un moment inoubliable,<br />L'équipe Myracoustic</p>
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
      subject: `${firstName}, un cadeau pour votre mariage 🤍`,
      htmlContent: html,
    }),
  });
}

// POST /api/admin/devis-discount — poser OU retirer une réduction « du moment »
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const body = await request.json();
  const { proposalId, remove } = body;
  if (!proposalId) return Response.json({ error: 'Proposition manquante' }, { status: 400 });

  const { data: p } = await supabaseAdmin
    .from('devis_proposals').select('*, mariage_leads(prenom, email)').eq('id', proposalId).maybeSingle();
  if (!p) return Response.json({ error: 'Proposition introuvable' }, { status: 404 });

  // ── Retrait de la réduction ──
  if (remove) {
    const { error } = await supabaseAdmin.from('devis_proposals')
      .update({ discount_type: null, discount_value: null, discount_until: null }).eq('id', proposalId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, removed: true });
  }

  // ── Pose d'une réduction ──
  const { discountType, discountValue, discountUntil } = body;
  const value = Number(discountValue);
  if (!['amount', 'percent'].includes(discountType) || !(value > 0) || !discountUntil || !/^\d{4}-\d{2}-\d{2}$/.test(discountUntil)) {
    return Response.json({ error: 'Réduction invalide (montant, type et date requis).' }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (discountUntil < today) return Response.json({ error: 'La date de la réduction doit être aujourd’hui ou plus tard.' }, { status: 400 });
  if (discountType === 'percent' && value >= 100) return Response.json({ error: 'Le pourcentage doit être inférieur à 100.' }, { status: 400 });

  const euros = discountEuros(p.total, discountType, value);
  if (euros <= 0) return Response.json({ error: 'La réduction dépasse ou annule le total.' }, { status: 400 });

  // La validité du devis doit couvrir au moins la durée de la réduction, sinon le client ne peut pas en profiter.
  const newValidUntil = (!p.valid_until || p.valid_until < discountUntil) ? discountUntil : p.valid_until;

  const { error } = await supabaseAdmin.from('devis_proposals').update({
    discount_type: discountType, discount_value: value, discount_until: discountUntil, valid_until: newValidUntil,
  }).eq('id', proposalId);
  if (error) return Response.json({ error: 'Enregistrement échoué : ' + error.message }, { status: 500 });

  const lead = p.mariage_leads || {};
  if (lead.email) {
    const label = discountType === 'percent' ? `−${value} %` : `−${value} €`;
    try { await sendDiscountEmail(lead.email.toLowerCase(), lead.prenom, p.token, label, Number(p.total) - euros, discountUntil); }
    catch (err) { console.error('Discount email error:', err.message); }
  }
  return Response.json({ ok: true });
}
