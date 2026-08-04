/* Client Google Calendar partagé (OAuth par refresh token).
   Même credentials que lib/qonto-sync.js, app/api/availability/route.js et
   app/api/qonto/webhook/route.js — ces 3 fichiers gardent leur propre copie
   (non retouchés), seuls les nouveaux consommateurs (calendrier d'appel)
   utilisent ce helper pour éviter un 4e copier-coller. */
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
