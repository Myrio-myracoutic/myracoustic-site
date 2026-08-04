import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendAvisEmail } from '@/app/lib/send-avis-email';

const APP_URL          = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER           = 'contact@myracoustic.com';

/* ── Templates email par statut ─────────────────────────────────── */
const EMAIL_CONFIGS = {
  devis_envoye: {
    subject: 'Votre devis Myracoustic est prêt',
    heading: 'Votre devis est disponible',
    body:    (eventType) => `Nous avons préparé votre devis pour votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong>.<br/>Consultez-le et signez-le directement depuis votre espace personnel.`,
    cta:     'Voir mon devis →',
    ctaUrl:  `${APP_URL}/mon-espace`,
    note:    'Vous pouvez signer votre devis en ligne depuis votre espace.',
  },
  accepte: {
    subject: 'Devis signé — votre espace est maintenant actif',
    heading: 'Devis signé, merci !',
    body:    (eventType) => `Votre devis pour votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong> a bien été enregistré.<br/>Votre espace personnel est maintenant entièrement actif : programme, playlists, invités…`,
    cta:     'Accéder à mon espace →',
    ctaUrl:  `${APP_URL}/mon-espace`,
    note:    "La réservation sera définitivement confirmée à réception de l'acompte.",
  },
  confirme: {
    subject: 'Acompte reçu — votre réservation est confirmée',
    heading: 'Réservation confirmée ✓',
    body:    (eventType) => `Votre acompte a bien été reçu. Votre réservation pour votre <strong style="color:#b8ef0b;">${eventType || 'événement'}</strong> est officiellement confirmée.<br/>Vous pouvez dès maintenant construire votre programme, vos playlists et inviter vos proches.`,
    cta:     'Préparer mon événement →',
    ctaUrl:  `${APP_URL}/mon-espace`,
    note:    'Le solde sera réglé selon les conditions de votre devis.',
  },
  annule: {
    subject: 'Annulation de votre réservation Myracoustic',
    heading: 'Annulation enregistrée',
    body:    () => `Nous avons bien pris en compte l'annulation de votre réservation.<br/>Nous sommes désolés de ne pas pouvoir vous accompagner cette fois-ci. N'hésitez pas à nous recontacter pour un futur projet.`,
    cta:     null,
    ctaUrl:  null,
    note:    null,
  },
};

function buildStatusEmail(firstName, status, eventType) {
  const cfg = EMAIL_CONFIGS[status];
  if (!cfg) return null;

  const bodyHtml = cfg.body(eventType);

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">${cfg.heading}</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0 0 32px;">${bodyHtml}</p>

    ${cfg.cta ? `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${cfg.ctaUrl}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">${cfg.cta}</a>
      </td></tr>
    </table>` : ''}

    ${cfg.note ? `<p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.6;">${cfg.note}</p>` : ''}
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

// Statuts où la facturation est impliquée → envoyer à l'email de facturation
// ('termine' géré séparément par sendAvisEmail, cf. plus bas)
const BILLING_STATUSES = new Set(['confirme']);

async function sendStatusEmail(toEmail, firstName, status, eventType, billingEmail) {
  const cfg = EMAIL_CONFIGS[status];
  if (!cfg || !toEmail) return;

  const html = buildStatusEmail(firstName, status, eventType);
  if (!html) return;

  // Pour les statuts facturation : envoyer À l'email billing + copie au compte principal
  // Sinon : envoyer uniquement au compte principal
  const isBillingStatus = BILLING_STATUSES.has(status) && billingEmail && billingEmail !== toEmail;
  const recipients = isBillingStatus
    ? [{ email: billingEmail }]
    : [{ email: toEmail, name: firstName }];
  const cc = isBillingStatus
    ? [{ email: toEmail, name: firstName }]
    : undefined;

  const subject = isBillingStatus
    ? `[Facturation] ${cfg.subject}`
    : cfg.subject;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:    { name: 'Myracoustic', email: SENDER },
      to:        recipients,
      ...(cc ? { cc } : {}),
      replyTo:   { email: SENDER, name: 'Myracoustic' },
      subject,
      htmlContent: html,
    }),
  });
}

/* ── Génération des playlists ───────────────────────────────────── */
async function generatePlaylists(eventId, eventType) {
  const { data: templates } = await supabaseAdmin
    .from('playlist_templates')
    .select('name, position')
    .eq('event_type', eventType)
    .order('position');

  if (!templates?.length) return;

  const { count } = await supabaseAdmin
    .from('playlists')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (count > 0) return;

  await supabaseAdmin.from('playlists').insert(
    templates.map(t => ({ event_id: eventId, name: t.name, position: t.position }))
  );
}

/* ── Routes ─────────────────────────────────────────────────────── */
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*, clients(*)')
    .eq('id', id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  // Récupérer l'événement actuel avec le client pour comparer le statut
  const { data: current } = await supabaseAdmin
    .from('events')
    .select('status, event_type, billing_email, clients(first_name, email)')
    .eq('id', id)
    .single();

  const previousStatus = current?.status;

  const updates = { updated_at: new Date().toISOString() };
  if (body.status           !== undefined) updates.status           = body.status;
  if (body.admin_notes      !== undefined) updates.admin_notes      = body.admin_notes;
  if (body.client_message   !== undefined) updates.client_message   = body.client_message;
  if (body.event_type       !== undefined) updates.event_type       = body.event_type;
  if (body.formule          !== undefined) updates.formule          = body.formule || null;
  if (body.event_date       !== undefined) updates.event_date       = body.event_date;
  if (body.qonto_quote_id   !== undefined) updates.qonto_quote_id   = body.qonto_quote_id;
  if (body.qonto_quote_url  !== undefined) updates.qonto_quote_url  = body.qonto_quote_url;
  if (body.venue            !== undefined) updates.venue            = body.venue;
  if (body.venue_cp         !== undefined) updates.venue_cp         = body.venue_cp;
  if (body.venue_city       !== undefined) updates.venue_city       = body.venue_city;

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('*, clients(*)')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Génère les playlists au premier passage en "accepté"
  if (body.status === 'accepte' && data.event_type) {
    generatePlaylists(id, data.event_type).catch(e =>
      console.error('generatePlaylists error:', e.message)
    );
  }

  // Envoie l'email si le statut a changé
  if (body.status && body.status !== previousStatus && current?.clients?.email) {
    if (body.status === 'termine') {
      await sendAvisEmail({
        toEmail: current.clients.email.toLowerCase(),
        firstName: current.clients.first_name || 'Client',
        eventType: current.event_type,
        eventId: id,
        billingEmail: current.billing_email || null,
      }).catch(e => console.error('sendAvisEmail error:', e.message));
    } else {
      await sendStatusEmail(
        current.clients.email,
        current.clients.first_name || 'Client',
        body.status,
        current.event_type,
        current.billing_email || null,
      ).catch(e => console.error('sendStatusEmail error:', e.message));
    }
  }

  return Response.json(data);
}
