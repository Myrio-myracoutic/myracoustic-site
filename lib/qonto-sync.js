import { parseDateFromHeader } from './parse-date-fr.js';
import { getCalendarClient, getCalendarId, blockCalendarDay } from './google-calendar.js';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function eventAlreadyCreated(calendar, invoiceId) {
  const res = await calendar.events.list({
    calendarId: getCalendarId(),
    privateExtendedProperty: `qonto_invoice_id=${invoiceId}`,
    maxResults: 1,
  });
  return (res.data.items?.length ?? 0) > 0;
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
  const calendar = getCalendarClient();

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

    await blockCalendarDay({
      date: eventDate,
      summary: `🎵 Prestation Myracoustic — ${clientName}`,
      description: `Facture ${invoiceNumber} — Acompte réglé. Date confirmée.`,
      extendedProperties: { private: { qonto_invoice_id: invoiceId } },
    });
    console.log(`[sync] Agenda créé : ${eventDate} — ${clientName} (${invoiceNumber})`);
    created++;
  }

  return { created, skipped, total: invoices.length };
}
