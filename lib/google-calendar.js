/* Client Google Calendar partagé (OAuth par refresh token).
   app/api/availability/route.js garde sa propre copie de l'auth (non retouché),
   mais lib/qonto-sync.js et app/api/qonto/webhook/route.js utilisent désormais
   ce helper — voir blockCalendarDay() ci-dessous. */
import { google } from 'googleapis';

export function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

export function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

/* Bloque une journée entière sur l'agenda (réservation ferme : acompte payé,
   prestation confirmée). Convention Google Calendar : end.date est EXCLUSIF,
   donc toujours le lendemain de la date pour un événement d'un seul jour —
   ne jamais créer ce type de blocage avec une heure de début/fin précise
   (start/end dateTime) : un événement ponctuel qui commence et finit le même
   jour civil ne bloque aucune date sur /api/availability. Bug réel rencontré
   le 06/08/2026 : un mariage saisi à la main comme un RDV de 15h-16h au lieu
   d'une journée entière n'apparaissait pas comme réservé, un devis a été
   envoyé à un autre prospect pour la même date. */
export async function blockCalendarDay({ date, summary, description, extendedProperties }) {
  const end = new Date(`${date}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const calendar = getCalendarClient();
  return calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: {
      summary,
      description,
      start: { date },
      end: { date: end.toISOString().slice(0, 10) },
      status: 'confirmed',
      transparency: 'opaque',
      ...(extendedProperties ? { extendedProperties } : {}),
    },
  });
}
