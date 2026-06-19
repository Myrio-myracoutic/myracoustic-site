import { google } from 'googleapis';
import { parseDateFromHeader } from './parse-date-fr.js';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function getCalendar() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

async function eventAlreadyCreated(calendar, invoiceId) {
  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    privateExtendedProperty: `qonto_invoice_id=${invoiceId}`,
    maxResults: 1,
  });
  return (res.data.items?.length ?? 0) > 0;
}

async function createCalendarEvent(calendar, eventDate, clientName, invoiceNumber, invoiceId) {
  await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary: `🎵 Prestation Myracoustic — ${clientName}`,
      description: `Facture ${invoiceNumber} — Acompte réglé. Date confirmée.`,
      start: { date: eventDate },
      end: { date: eventDate },
      status: 'confirmed',
      transparency: 'opaque',
      extendedProperties: {
        private: { qonto_invoice_id: invoiceId },
      },
    },
  });
}

async function getEventDateFromInvoice(inv) {
  if (inv?.performance_start_date) return inv.performance_start_date.slice(0, 10);

  const quoteId = inv?.quote_id;
  if (!quoteId) return null;

  const qRes = await fetch(`${QONTO_BASE}/quotes/${quoteId}`, { headers: qHeaders() });
  if (!qRes.ok) return null;
  const qData = await qRes.json();
  return parseDateFromHeader(qData.quote?.header);
}

export async function runSync() {
  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const url = `${QONTO_BASE}/client_invoices?status=paid&updated_at_from=${since}&per_page=50`;
  const res = await fetch(url, { headers: qHeaders() });
  if (!res.ok) throw new Error(`Qonto client_invoices: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const invoices = data.client_invoices ?? [];
  const calendar = getCalendar();

  let created = 0;
  let skipped = 0;

  for (const inv of invoices) {
    const invoiceId = inv.id;
    const clientName = inv.client_name || inv.client?.name || 'Client';
    const invoiceNumber = inv.number || invoiceId;

    if (await eventAlreadyCreated(calendar, invoiceId)) {
      skipped++;
      continue;
    }

    const detailRes = await fetch(`${QONTO_BASE}/client_invoices/${invoiceId}`, { headers: qHeaders() });
    const detailData = detailRes.ok ? await detailRes.json() : {};
    const fullInv = detailData.client_invoice || inv;

    const eventDate = await getEventDateFromInvoice(fullInv);
    if (!eventDate) {
      skipped++;
      continue;
    }

    await createCalendarEvent(calendar, eventDate, clientName, invoiceNumber, invoiceId);
    console.log(`[sync] Agenda créé : ${eventDate} — ${clientName} (${invoiceNumber})`);
    created++;
  }

  return { created, skipped, total: invoices.length };
}
