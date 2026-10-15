/* Compte les samedis réellement libres sur la saison des mariages (avril à
   septembre inclus), à partir du même calendrier Google que /api/availability
   (source de vérité des réservations, tous types d'événements confondus).
   La saison ciblée est toujours la prochaine à venir : celle de cette année
   si on est encore avant fin septembre, sinon celle de l'année suivante —
   pour créer de l'urgence sur un total fixe (« X sur les ~27 de la saison
   2027 ») plutôt qu'une fenêtre glissante. Best-effort : en cas d'erreur,
   renvoie null plutôt qu'un chiffre inventé — l'appelant doit alors afficher
   un message neutre. */
import { getCalendarClient, getCalendarId } from './google-calendar';

const SEASON_START_MONTH = 3; // avril (0-indexé)
const SEASON_END_MONTH = 8;   // septembre (0-indexé)

function seasonYear(today) {
  const y = today.getUTCFullYear();
  const seasonEnd = new Date(Date.UTC(y, SEASON_END_MONTH + 1, 0, 23, 59, 59));
  return today > seasonEnd ? y + 1 : y;
}

function saturdaysBetween(start, end) {
  const out = [];
  const cur = new Date(start);
  while (cur < end) {
    if (cur.getUTCDay() === 6) out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export async function getAvailableSaturdays() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const year = seasonYear(today);
  const start = new Date(Date.UTC(year, SEASON_START_MONTH, 1));
  const end = new Date(Date.UTC(year, SEASON_END_MONTH + 1, 1)); // 1er octobre (exclusif)

  // Total fixe de la saison (tous les samedis avril-septembre, même ceux déjà
  // passés si on est en cours de saison) — dénominateur affiché pour l'urgence.
  const totalSaturdays = saturdaysBetween(start, end);
  if (totalSaturdays.length === 0) return null;

  // Samedis encore réservables à partir d'aujourd'hui (exclut les samedis
  // déjà passés de cette saison, qui ne peuvent plus être booking de toute façon).
  const bookableSaturdays = saturdaysBetween(new Date(Math.max(start, today)), end);

  try {
    const calendar = getCalendarClient();
    const res = await calendar.events.list({
      calendarId: getCalendarId(),
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      maxResults: 500,
      fields: 'items(start,end,transparency,status,extendedProperties)',
    });

    const bookedDates = new Set();
    for (const evt of res.data.items ?? []) {
      if (evt.status === 'cancelled') continue;
      if (evt.transparency === 'transparent') continue;
      // Un appel téléphonique réservé ne compte pas comme une date prise (voir
      // app/api/availability/route.js pour le détail).
      if (evt.extendedProperties?.private?.kind === 'call_appointment') continue;
      const s = evt.start?.date || evt.start?.dateTime?.slice(0, 10);
      const e = evt.end?.date || evt.end?.dateTime?.slice(0, 10);
      if (!s) continue;
      const c = new Date(s);
      const fin = new Date(e || s);
      // do-while : un événement qui démarre et finit le même jour doit quand
      // même bloquer ce jour (voir app/api/availability/route.js pour le détail).
      do { bookedDates.add(c.toISOString().slice(0, 10)); c.setDate(c.getDate() + 1); } while (c < fin);
    }

    const available = bookableSaturdays.filter((d) => !bookedDates.has(d)).length;

    return { available, total: totalSaturdays.length, year };
  } catch (err) {
    console.error('getAvailableSaturdays error:', err.message);
    return null;
  }
}
