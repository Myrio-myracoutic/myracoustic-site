import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { isDateInBookingWindow, ADMIN_BOOKING_WINDOW_DAYS } from '@/lib/call-slots';
import { bookCallSlot, deleteCallGoogleEvent, cancelCallSlot, sendBookingLinkForLead } from '@/app/lib/call-booking';

// GET /api/admin/qonto-quotes — suivi des devis Qonto du tunnel particulier
// (brouillons à finaliser + envoyés en attente + statut réel, cf. 2026-08-05_qonto_quotes_tracking.sql)
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // .neq() exclut aussi les lignes à event_type NULL en SQL — on veut les garder (particulier/pro
  // sans type renseigné), donc filtre explicite is.null OR neq plutôt qu'un simple .neq().
  const { data, error } = await supabaseAdmin
    .from('qonto_quotes_tracking')
    .select('*')
    .or('event_type.is.null,event_type.neq.Mariage')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ quotes: data || [] });
}

// PATCH /api/admin/qonto-quotes — mêmes actions que /api/admin/mariage-leads (planning d'appel) :
// - cancelCall: true → annule un appel réservé
// - setCall: { date, time } → programme ou reprogramme un appel
export async function PATCH(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id, cancelCall, setCall, sendBookingLink } = await request.json();
  if (!id) return Response.json({ error: 'id manquant' }, { status: 400 });

  if (cancelCall) {
    const result = await cancelCallSlot({ kind: 'devis', refId: id });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  if (sendBookingLink) {
    const result = await sendBookingLinkForLead({ kind: 'devis', refId: id });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  if (setCall) {
    const { date, time } = setCall;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !/^\d{2}:\d{2}$/.test(time)) {
      return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    if (!isDateInBookingWindow(date, ADMIN_BOOKING_WINDOW_DAYS)) {
      return Response.json({ error: 'Date hors de la fenêtre autorisée' }, { status: 400 });
    }

    const { data: quote } = await supabaseAdmin
      .from('qonto_quotes_tracking').select('call_google_event_id, call_scheduled_at, call_cancelled_at').eq('id', id).maybeSingle();
    const isReschedule = !!quote?.call_scheduled_at && !quote?.call_cancelled_at;
    await deleteCallGoogleEvent(quote?.call_google_event_id);

    const result = await bookCallSlot({ kind: 'devis', refId: id, date, time, requireEmptySlot: false, windowDays: ADMIN_BOOKING_WINDOW_DAYS, isReschedule });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Action inconnue' }, { status: 400 });
}

// DELETE /api/admin/qonto-quotes — supprimer une entrée du suivi
export async function DELETE(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) return Response.json({ error: 'id manquant' }, { status: 400 });
  const { error } = await supabaseAdmin.from('qonto_quotes_tracking').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
