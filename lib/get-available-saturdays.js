/* Compte les samedis réellement libres sur les prochains mois, à partir du
   même calendrier Google que /api/availability (source de vérité des
   réservations, tous types d'événements confondus). Best-effort : en cas
   d'erreur, renvoie null plutôt qu'un chiffre inventé — l'appelant doit
   alors afficher un message neutre. */
import { getCalendarClient, getCalendarId } from './google-calendar';

const MONTHS = 4;

export async function getAvailableSaturdays() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + MONTHS);

  const saturdays = [];
  const cur = new Date(start);
  while (cur < end) {
    if (cur.getUTCDay() === 6) saturdays.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  if (saturdays.length === 0) return null;

  try {
    const calendar = getCalendarClient();
    const res = await calendar.events.list({
      calendarId: getCalendarId(),
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      maxResults: 500,
      fields: 'items(start,end,transparency,status)',
    });

    const bookedDates = new Set();
    for (const evt of res.data.items ?? []) {
      if (evt.status === 'cancelled') continue;
      if (evt.transparency === 'transparent') continue;
      const s = evt.start?.date || evt.start?.dateTime?.slice(0, 10);
      const e = evt.end?.date || evt.end?.dateTime?.slice(0, 10);
      if (!s) continue;
      const c = new Date(s);
      const fin = new Date(e || s);
      // do-while : un événement qui démarre et finit le même jour doit quand
      // même bloquer ce jour (voir app/api/availability/route.js pour le détail).
      do { bookedDates.add(c.toISOString().slice(0, 10)); c.setDate(c.getDate() + 1); } while (c < fin);
    }

    const available = saturdays.filter((d) => !bookedDates.has(d)).length;
    const until = new Date(end);
    until.setUTCDate(until.getUTCDate() - 1);
    const untilLabel = until.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return { available, total: saturdays.length, untilLabel };
  } catch (err) {
    console.error('getAvailableSaturdays error:', err.message);
    return null;
  }
}
