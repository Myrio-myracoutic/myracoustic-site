/* Calcul des créneaux d'appel disponibles pour une date donnée.
   Partagé entre GET /api/call-availability (affichage) et POST /api/call-bookings
   (revalidation serveur — jamais confiance au client sur ce qu'il a affiché). */
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getCalendarClient, getCalendarId } from '@/lib/google-calendar';
import { todayInParis, parisWeekday, parisLocalToUtcISO, addMinutesToTime, nowInParis, timeToMinutes } from '@/lib/paris-time';

const BOOKING_WINDOW_DAYS = 7;
// Fenêtre plus large pour l'admin : il peut recaler un appel plus loin que les 7 jours
// publics (ex. client dispo seulement dans 3 semaines), la dispo Google reste vérifiée.
export const ADMIN_BOOKING_WINDOW_DAYS = 30;
const NOTICE_MINUTES = 60; // préavis minimum si on réserve pour aujourd'hui
const DEFAULT_SLOT_MINUTES = 15;

export function maxBookableDate(windowDays = BOOKING_WINDOW_DAYS) {
  const d = new Date(`${todayInParis()}T12:00:00`);
  d.setDate(d.getDate() + windowDays);
  return d.toISOString().slice(0, 10);
}

export function isDateInBookingWindow(dateStr, windowDays = BOOKING_WINDOW_DAYS) {
  return dateStr >= todayInParis() && dateStr <= maxBookableDate(windowDays);
}

/* Durée d'un créneau (minutes), réglable en admin (/admin/planning-appels).
   Repli sur 15 min si la ligne de réglages est absente (ne devrait pas arriver,
   une ligne par défaut est posée par la migration). */
export async function getSlotDurationMinutes() {
  const { data } = await supabaseAdmin
    .from('call_settings').select('slot_duration_minutes').eq('id', 1).maybeSingle();
  return data?.slot_duration_minutes || DEFAULT_SLOT_MINUTES;
}

function generateCandidateSlots(ranges, slotMinutes) {
  const slots = [];
  for (const { start_time, end_time } of ranges) {
    let cur = start_time.slice(0, 5); // "09:00:00" -> "09:00"
    const end = end_time.slice(0, 5);
    while (cur < end) {
      const next = addMinutesToTime(cur, slotMinutes);
      if (next > end) break;
      slots.push(cur);
      cur = next;
    }
  }
  return slots;
}

/* Retourne les créneaux "HH:mm" disponibles pour dateStr (YYYY-MM-DD, jour Paris).
   windowDays : fenêtre de réservation à respecter (7 j public, ADMIN_BOOKING_WINDOW_DAYS côté admin). */
export async function getAvailableSlots(dateStr, windowDays = BOOKING_WINDOW_DAYS) {
  if (!isDateInBookingWindow(dateStr, windowDays)) return [];

  const slotMinutes = await getSlotDurationMinutes();
  const weekday = parisWeekday(dateStr);
  const { data: ranges } = await supabaseAdmin
    .from('call_schedule')
    .select('start_time, end_time')
    .eq('weekday', weekday)
    .eq('enabled', true);

  let slots = generateCandidateSlots(ranges || [], slotMinutes);
  if (!slots.length) return [];

  // Aujourd'hui : exclut les créneaux déjà passés + préavis minimum.
  // Comparaison en minutes depuis minuit (pas en string "HH:mm") : au-delà de 23h,
  // "maintenant + préavis" dépasse minuit et une comparaison de texte se tromperait
  // ("00:16" est "avant" "09:00" alphabétiquement, alors que c'est le lendemain).
  if (dateStr === todayInParis()) {
    const minMinutes = timeToMinutes(nowInParis()) + NOTICE_MINUTES;
    if (minMinutes >= 24 * 60) return []; // le préavis dépasse minuit : plus aucun créneau aujourd'hui
    slots = slots.filter(s => timeToMinutes(s) >= minMinutes);
    if (!slots.length) return [];
  }

  // Google Calendar : freebusy sur la journée entière (00:00 -> 23:59 Paris).
  try {
    const calendar = getCalendarClient();
    const calId = getCalendarId();
    const timeMin = parisLocalToUtcISO(dateStr, '00:00');
    const timeMax = parisLocalToUtcISO(dateStr, '23:59');
    const res = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: calId }] },
    });
    const busy = res.data.calendars?.[calId]?.busy || [];
    if (busy.length) {
      slots = slots.filter(s => {
        const slotStart = new Date(parisLocalToUtcISO(dateStr, s)).getTime();
        const slotEnd = new Date(parisLocalToUtcISO(dateStr, addMinutesToTime(s, slotMinutes))).getTime();
        return !busy.some(b => {
          const bStart = new Date(b.start).getTime();
          const bEnd = new Date(b.end).getTime();
          return slotStart < bEnd && slotEnd > bStart;
        });
      });
    }
  } catch (err) {
    console.error('freebusy error:', err.message);
    // Pas de créneau proposé si Google Calendar est injoignable — mieux vaut
    // ne rien montrer que de proposer un créneau potentiellement déjà pris.
    return [];
  }
  if (!slots.length) return [];

  // Garde-fou supplémentaire : autres leads déjà réservés ce jour-là.
  const dayStart = parisLocalToUtcISO(dateStr, '00:00');
  const dayEnd = parisLocalToUtcISO(dateStr, '23:59');
  const { data: bookedRows } = await supabaseAdmin
    .from('mariage_leads')
    .select('call_scheduled_at')
    .gte('call_scheduled_at', dayStart)
    .lte('call_scheduled_at', dayEnd)
    .is('call_cancelled_at', null);

  // Comparaison par valeur numérique (timestamp), pas par égalité de string ISO
  // (le format renvoyé par Postgres peut différer légèrement de .toISOString()).
  const bookedTimes = new Set((bookedRows || []).map(r => new Date(r.call_scheduled_at).getTime()));
  slots = slots.filter(s => !bookedTimes.has(new Date(parisLocalToUtcISO(dateStr, s)).getTime()));

  return slots;
}
