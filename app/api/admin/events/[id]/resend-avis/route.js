import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendAvisEmail } from '@/app/lib/send-avis-email';

// POST /api/admin/events/[id]/resend-avis — relance manuelle de l'email « merci + avis »
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;

  const { data: ev, error } = await supabaseAdmin
    .from('events')
    .select('status, event_type, billing_email, clients(first_name, email)')
    .eq('id', id)
    .single();
  if (error || !ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });
  if (ev.status !== 'termine') {
    return Response.json({ error: "Cet email n'existe que pour un événement au statut « Terminé »." }, { status: 400 });
  }

  const email = ev.clients?.email;
  if (!email) return Response.json({ error: 'Aucun email pour ce client.' }, { status: 400 });

  try {
    await sendAvisEmail({
      toEmail: email.toLowerCase(),
      firstName: ev.clients?.first_name || 'Client',
      eventType: ev.event_type,
      eventId: id,
      billingEmail: ev.billing_email || null,
    });
  } catch (e) {
    return Response.json({ error: 'Envoi échoué : ' + e.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
