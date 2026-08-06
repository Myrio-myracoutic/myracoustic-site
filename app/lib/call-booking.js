/* Logique de réservation d'un créneau d'appel, partagée entre :
   - POST /api/call-bookings (tunnel public, requireEmptySlot: true — anti-race sur une fiche fraîche)
   - PATCH /api/admin/mariage-leads, /api/admin/qonto-quotes, /api/admin/pro-contacts
     { setCall } (admin, requireEmptySlot: false — programme ou reprogramme un appel pour une
     fiche existante, avec une fenêtre de dates plus large).

   Trois "kind" possibles selon d'où vient la fiche à rappeler — un seul moteur de réservation,
   pas une copie par tunnel (leçon du bug de calendrier du 06/08 : un copier-coller de la logique
   de blocage de journée avait déjà causé un vrai bug de production, voir site/CLAUDE.md). */
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getCalendarClient, getCalendarId } from '@/lib/google-calendar';
import { addMinutesToTime, parisLocalToUtcISO } from '@/lib/paris-time';
import { getAvailableSlots, getSlotDurationMinutes } from '@/lib/call-slots';
import { sendCallConfirmEmail, sendCallCancelEmail, fmtSlotDateTime } from '@/app/lib/send-call-confirm-email';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

const SOURCES = {
  mariage: {
    table: 'mariage_leads',
    select: 'id, prenom, nom, tel, email, event_date, lieu, guests, message',
    summary: (r) => `📞 Appel — ${r.prenom} ${r.nom} (mariage)`,
    description: (r) => [
      `Tél : ${r.tel}`,
      `Email : ${r.email}`,
      r.event_date ? `Date de mariage envisagée : ${fmtDate(r.event_date)}` : null,
      r.lieu ? `Lieu : ${r.lieu}` : null,
      r.guests ? `Invités : ${r.guests}` : null,
      r.message ? `Message : ${r.message}` : null,
    ],
    extendedKey: 'mariage_lead_id',
    firstName: (r) => r.prenom,
    tel: (r) => r.tel,
    email: (r) => r.email,
    topic: 'de votre mariage',
    cancelSelect: 'call_google_event_id, prenom, email, call_scheduled_at',
  },
  devis: {
    table: 'qonto_quotes_tracking',
    select: 'id, client_first_name, client_last_name, client_phone, client_email, event_type, event_date, venue',
    summary: (r) => `📞 Appel — ${r.client_first_name} ${r.client_last_name} (devis)`,
    description: (r) => [
      `Tél : ${r.client_phone}`,
      `Email : ${r.client_email}`,
      r.event_type ? `Type d'événement : ${r.event_type}` : null,
      r.event_date ? `Date envisagée : ${fmtDate(r.event_date)}` : null,
      r.venue ? `Lieu : ${r.venue}` : null,
    ],
    extendedKey: 'qonto_quote_tracking_id',
    firstName: (r) => r.client_first_name,
    tel: (r) => r.client_phone,
    email: (r) => r.client_email,
    topic: 'de votre devis',
    cancelSelect: 'call_google_event_id, client_first_name, client_email, call_scheduled_at',
  },
  pro_contact: {
    table: 'pro_contact_leads',
    select: 'id, prenom, nom, societe, email, tel, event_type, personnes, event_date, budget, lieu, description',
    summary: (r) => `📞 Appel — ${r.prenom} ${r.nom} (${r.societe})`,
    description: (r) => [
      `Tél : ${r.tel}`,
      `Email : ${r.email}`,
      `Société : ${r.societe}`,
      r.event_type ? `Type d'événement : ${r.event_type}` : null,
      r.personnes ? `Effectif : ${r.personnes}` : null,
      r.event_date ? `Date souhaitée : ${r.event_date}` : null,
      r.lieu ? `Lieu : ${r.lieu}` : null,
    ],
    extendedKey: 'pro_contact_lead_id',
    firstName: (r) => r.prenom,
    tel: (r) => r.tel,
    email: (r) => r.email,
    topic: 'de votre projet',
    cancelSelect: 'call_google_event_id, prenom, email, call_scheduled_at',
  },
};

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

/* Réserve/programme le créneau (date, time) pour la fiche `refId` du type `kind`.
   requireEmptySlot=true : n'écrase que si call_scheduled_at est encore vide (protection
   anti-race publique — deux onglets ne peuvent pas confirmer la même fiche deux fois).
   requireEmptySlot=false : écrase sans condition (admin, programmation ou modification
   d'une fiche déjà connue) — la collision inter-fiches reste bloquée par l'index unique.
   windowDays : fenêtre de réservation (7 j public, ADMIN_BOOKING_WINDOW_DAYS admin).
   isReschedule : adapte le texte de l'email de confirmation (« modifié » plutôt que
   « confirmé ») quand ça remplace un rendez-vous déjà existant. */
export async function bookCallSlot({ kind = 'mariage', refId, date, time, requireEmptySlot, windowDays, isReschedule = false }) {
  const src = SOURCES[kind];
  if (!src) return { error: 'invalid_kind', status: 400 };

  const slots = await getAvailableSlots(date, windowDays);
  if (!slots.includes(time)) return { error: 'slot_taken', status: 409 };

  const isoStart = parisLocalToUtcISO(date, time);
  const slotMinutes = await getSlotDurationMinutes();

  let query = supabaseAdmin
    .from(src.table)
    .update({ call_scheduled_at: isoStart, call_duration_minutes: slotMinutes, call_cancelled_at: null, call_google_event_id: null })
    .eq('id', refId);
  if (requireEmptySlot) query = query.is('call_scheduled_at', null);

  const { data: updated, error: updateErr } = await query.select(src.select).maybeSingle();

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

    const evRes = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary: src.summary(updated),
        description: src.description(updated).filter(Boolean).join('\n'),
        start: { dateTime: `${date}T${time}:00`, timeZone: 'Europe/Paris' },
        end:   { dateTime: `${date}T${endTime}:00`, timeZone: 'Europe/Paris' },
        status: 'confirmed',
        transparency: 'opaque',
        extendedProperties: { private: { [src.extendedKey]: refId, kind: 'call_appointment' } },
      },
    });

    await supabaseAdmin
      .from(src.table)
      .update({ call_google_event_id: evRes.data.id })
      .eq('id', refId);
  } catch (err) {
    console.error('call booking calendar event error:', err.message);
  }

  // Email de confirmation du créneau : best-effort, comme l'événement Google ci-dessus.
  try {
    await sendCallConfirmEmail({
      toEmail: src.email(updated),
      firstName: src.firstName(updated),
      tel: src.tel(updated),
      slotLabel: fmtSlotDateTime(date, time),
      isReschedule,
      topic: src.topic,
    });
  } catch (err) {
    console.error('call booking confirm email error:', err.message);
  }

  return { ok: true, date, time };
}

/* Annule l'appel programmé sur la fiche `refId` du type `kind` : supprime l'événement Google
   (best-effort) puis pose call_cancelled_at. Best-effort aussi sur l'email d'annulation —
   l'annulation reste actée en base quoi qu'il arrive. */
export async function cancelCallSlot({ kind = 'mariage', refId }) {
  const src = SOURCES[kind];
  if (!src) return { error: 'invalid_kind', status: 400 };

  const { data: row } = await supabaseAdmin
    .from(src.table).select(src.cancelSelect).eq('id', refId).maybeSingle();
  await deleteCallGoogleEvent(row?.call_google_event_id);

  const { error } = await supabaseAdmin
    .from(src.table)
    .update({ call_cancelled_at: new Date().toISOString() })
    .eq('id', refId);
  if (error) return { error: error.message, status: 500 };

  if (row?.call_scheduled_at) {
    try {
      await sendCallCancelEmail({ toEmail: src.email(row), firstName: src.firstName(row) });
    } catch (err) {
      console.error('call cancel email error:', err.message);
    }
  }
  return { ok: true };
}
