/* Logique de réservation d'un créneau d'appel, partagée entre :
   - POST /api/call-bookings (tunnel public, requireEmptySlot: true — anti-race sur un lead frais)
   - PATCH /api/admin/mariage-leads { setCall } (admin, requireEmptySlot: false — programme ou
     reprogramme un appel pour un lead existant, avec une fenêtre de dates plus large). */
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getCalendarClient, getCalendarId } from '@/lib/google-calendar';
import { addMinutesToTime, parisLocalToUtcISO } from '@/lib/paris-time';
import { getAvailableSlots, getSlotDurationMinutes } from '@/lib/call-slots';
import { sendCallConfirmEmail, fmtSlotDateTime } from '@/app/lib/send-call-confirm-email';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

// Supprime l'événement Google d'un appel (best-effort, tolère déjà supprimé) — utilisé
// à l'annulation ET juste avant une reprogrammation (l'ancien créneau ne doit plus apparaître).
export async function deleteCallGoogleEvent(googleEventId) {
  if (!googleEventId) return;
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: getCalendarId(), eventId: googleEventId });
  } catch (err) {
    console.error('Calendar delete error:', err.message);
  }
}

/* Réserve/programme le créneau (date, time) pour un lead.
   requireEmptySlot=true : n'écrase que si call_scheduled_at est encore vide (protection
   anti-race publique — deux onglets ne peuvent pas confirmer le même lead deux fois).
   requireEmptySlot=false : écrase sans condition (admin, programmation ou modification
   d'un lead déjà connu) — la collision inter-leads reste bloquée par l'index unique.
   windowDays : fenêtre de réservation (7 j public, ADMIN_BOOKING_WINDOW_DAYS admin).
   isReschedule : adapte le texte de l'email de confirmation (« modifié » plutôt que
   « confirmé ») quand ça remplace un rendez-vous déjà existant. */
export async function bookCallSlot({ leadId, date, time, requireEmptySlot, windowDays, isReschedule = false }) {
  const slots = await getAvailableSlots(date, windowDays);
  if (!slots.includes(time)) return { error: 'slot_taken', status: 409 };

  const isoStart = parisLocalToUtcISO(date, time);
  const slotMinutes = await getSlotDurationMinutes();

  let query = supabaseAdmin
    .from('mariage_leads')
    .update({ call_scheduled_at: isoStart, call_duration_minutes: slotMinutes, call_cancelled_at: null, call_google_event_id: null })
    .eq('id', leadId);
  if (requireEmptySlot) query = query.is('call_scheduled_at', null);

  const { data: updated, error: updateErr } = await query
    .select('id, prenom, nom, tel, email, event_date, lieu, guests, message')
    .maybeSingle();

  if (updateErr) {
    if (updateErr.code === '23505') return { error: 'slot_taken', status: 409 };
    return { error: updateErr.message, status: 500 };
  }
  if (!updated) return { error: 'lead_already_booked', status: 409 };

  // Événement Google Calendar : best-effort. Si ça échoue, la réservation en base
  // reste valide — un admin peut recréer l'événement à la main si besoin.
  try {
    const calendar = getCalendarClient();
    const calId = getCalendarId();
    const endTime = addMinutesToTime(time, slotMinutes);
    const description = [
      `Tél : ${updated.tel}`,
      `Email : ${updated.email}`,
      updated.event_date ? `Date de mariage envisagée : ${fmtDate(updated.event_date)}` : null,
      updated.lieu ? `Lieu : ${updated.lieu}` : null,
      updated.guests ? `Invités : ${updated.guests}` : null,
      updated.message ? `Message : ${updated.message}` : null,
    ].filter(Boolean).join('\n');

    const evRes = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary: `📞 Appel — ${updated.prenom} ${updated.nom} (mariage)`,
        description,
        start: { dateTime: `${date}T${time}:00`, timeZone: 'Europe/Paris' },
        end:   { dateTime: `${date}T${endTime}:00`, timeZone: 'Europe/Paris' },
        status: 'confirmed',
        transparency: 'opaque',
        extendedProperties: { private: { mariage_lead_id: leadId, kind: 'call_appointment' } },
      },
    });

    await supabaseAdmin
      .from('mariage_leads')
      .update({ call_google_event_id: evRes.data.id })
      .eq('id', leadId);
  } catch (err) {
    console.error('call booking calendar event error:', err.message);
  }

  // Email de confirmation du créneau : best-effort, comme l'événement Google ci-dessus.
  try {
    await sendCallConfirmEmail({
      toEmail: updated.email,
      firstName: updated.prenom,
      tel: updated.tel,
      slotLabel: fmtSlotDateTime(date, time),
      isReschedule,
    });
  } catch (err) {
    console.error('call booking confirm email error:', err.message);
  }

  return { ok: true, date, time };
}
