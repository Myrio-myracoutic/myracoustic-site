import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { parseDateFromHeader } from '@/lib/parse-date-fr';

export const dynamic = 'force-dynamic';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/* Compte les devis "envoyés mais pas encore acceptés" par date de prestation */
async function getPendingDates() {
  const counts = {};

  const res = await fetch(`${QONTO_BASE}/quotes?per_page=100`, { headers: qHeaders() });
  if (!res.ok) return counts;
  const data = await res.json();
  const quotes = data.quotes ?? [];

  for (const quote of quotes) {
    if (quote.status !== 'pending_approval') continue;

    const date = parseDateFromHeader(quote.header);
    if (!date) continue;

    counts[date] = (counts[date] ?? 0) + 1;
  }

  return counts;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start'); // YYYY-MM-DD
  const end   = searchParams.get('end');   // YYYY-MM-DD

  if (!start || !end) {
    return NextResponse.json({ error: 'start et end requis' }, { status: 400 });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth });
    const calId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const res = await calendar.events.list({
      calendarId: calId,
      timeMin: new Date(`${start}T00:00:00`).toISOString(),
      timeMax: new Date(`${end}T23:59:59`).toISOString(),
      singleEvents: true,
      maxResults: 500,
      fields: 'items(start,end,transparency,status)',
    });

    const events = res.data.items ?? [];
    const bookedDates = new Set();

    for (const evt of events) {
      // Ignore les événements déclinés ou marqués "disponible"
      if (evt.status === 'cancelled') continue;
      if (evt.transparency === 'transparent') continue;

      const s = evt.start?.date || evt.start?.dateTime?.slice(0, 10);
      const e = evt.end?.date   || evt.end?.dateTime?.slice(0, 10);
      if (!s) continue;

      const cur = new Date(s);
      const fin = new Date(e || s);
      while (cur < fin) {
        bookedDates.add(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
    }

    let pendingDates = {};
    try {
      pendingDates = await getPendingDates();
    } catch (err) {
      console.error('Qonto pending quotes error:', err.message);
    }

    return NextResponse.json({ bookedDates: [...bookedDates], pendingDates });

  } catch (err) {
    console.error('Google Calendar error:', err.message);
    return NextResponse.json({ bookedDates: [], pendingDates: {} });
  }
}
