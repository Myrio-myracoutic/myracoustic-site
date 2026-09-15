import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { isDateInBookingWindow, ADMIN_BOOKING_WINDOW_DAYS } from '@/lib/call-slots';
import { bookCallSlot, deleteCallGoogleEvent, cancelCallSlot, sendBookingLinkForLead, MILESTONE_LABELS } from '@/app/lib/call-booking';

const MILESTONE_ORDER = ['presentation', 'visite_lieu', 'point_1_mois', 'reglages_2_semaines'];

// GET /api/admin/event-milestones?eventId=xxx — les 4 étapes de suivi d'un événement
// (voir supabase-migrations/2026-09-14_event_milestones.sql), triées dans l'ordre du parcours.
export async function GET(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) return Response.json({ error: 'eventId manquant' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('event_milestones')
    .select('id, milestone_type, target_date, call_scheduled_at, call_cancelled_at, call_token')
    .eq('event_id', eventId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const milestones = MILESTONE_ORDER
    .map(type => (data || []).find(m => m.milestone_type === type))
    .filter(Boolean)
    .map(m => ({ ...m, label: MILESTONE_LABELS[m.milestone_type] }));

  return Response.json({ milestones });
}

// PATCH /api/admin/event-milestones — actions ponctuelles sur une étape :
// - setCall: { date, time } → programme ou reprogramme le rendez-vous
// - cancelCall: true → annule un rendez-vous réservé
// - sendBookingLink: true → renvoie au client le lien pour choisir lui-même son créneau
export async function PATCH(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id, cancelCall, setCall, sendBookingLink } = await request.json();
  if (!id) return Response.json({ error: 'id manquant' }, { status: 400 });

  if (cancelCall) {
    const result = await cancelCallSlot({ kind: 'event_milestone', refId: id });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  if (sendBookingLink) {
    const result = await sendBookingLinkForLead({ kind: 'event_milestone', refId: id });
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

    const { data: milestone } = await supabaseAdmin
      .from('event_milestones').select('call_google_event_id, call_scheduled_at, call_cancelled_at').eq('id', id).maybeSingle();
    const isReschedule = !!milestone?.call_scheduled_at && !milestone?.call_cancelled_at;
    await deleteCallGoogleEvent(milestone?.call_google_event_id);

    const result = await bookCallSlot({ kind: 'event_milestone', refId: id, date, time, requireEmptySlot: false, windowDays: ADMIN_BOOKING_WINDOW_DAYS, isReschedule });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Action inconnue' }, { status: 400 });
}
