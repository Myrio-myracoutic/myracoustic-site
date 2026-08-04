import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendAvisEmail } from '@/app/lib/send-avis-email';

// POST /api/admin/events/[id]/resend-avis — envoi ou relance manuelle de la demande d'avis.
// Indépendant du statut : possible dès que la date de l'événement est passée.
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;

  const { data: ev, error } = await supabaseAdmin
    .from('events')
    .select('status, event_date, event_type, clients(first_name, email)')
    .eq('id', id)
    .single();
  if (error || !ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });
  if (ev.status === 'annule') {
    return Response.json({ error: 'Cet événement est annulé.' }, { status: 400 });
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!ev.event_date || ev.event_date > todayStr) {
    return Response.json({ error: "L'événement n'a pas encore eu lieu." }, { status: 400 });
  }

  const email = ev.clients?.email;
  if (!email) return Response.json({ error: 'Aucun email pour ce client.' }, { status: 400 });

  try {
    await sendAvisEmail({
      toEmail: email.toLowerCase(),
      firstName: ev.clients?.first_name || 'Client',
      eventType: ev.event_type,
      eventId: id,
    });
  } catch (e) {
    return Response.json({ error: 'Envoi échoué : ' + e.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
