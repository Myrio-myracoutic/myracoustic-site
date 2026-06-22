import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { NextResponse } from 'next/server';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request) {
  if (!(await verifyAdminCookie())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim();
  if (!email) return NextResponse.json({ quotes: [] });

  // Chercher le client Qonto par email
  const cRes = await fetch(
    `${QONTO_BASE}/clients?q=${encodeURIComponent(email)}&per_page=50`,
    { headers: qHeaders() }
  );
  if (!cRes.ok) return NextResponse.json({ quotes: [] });
  const cData = await cRes.json();
  const client = cData.clients?.find(c => c.email?.toLowerCase() === email.toLowerCase());
  if (!client) return NextResponse.json({ quotes: [], clientFound: false });

  // Récupérer devis + factures en parallèle
  const [qRes, invRes] = await Promise.all([
    fetch(`${QONTO_BASE}/quotes?per_page=100`, { headers: qHeaders() }),
    fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() }),
  ]);

  const qData   = qRes.ok   ? await qRes.json()   : { quotes: [] };
  const invData = invRes.ok ? await invRes.json() : { client_invoices: [] };

  // Construire un index des factures par numéro de devis référencé dans le titre
  // ex: "Acompte du devis DEV-2026-048" → DEV-2026-048
  const invoicesByDevis = {};
  for (const inv of (invData.client_invoices || [])) {
    // Lien direct via quote_id
    const directQuoteId = inv.quote_id;
    if (directQuoteId) {
      if (!invoicesByDevis[directQuoteId]) invoicesByDevis[directQuoteId] = [];
      invoicesByDevis[directQuoteId].push(inv);
      continue;
    }
    // Lien indirect via le titre des lignes (ex: "Acompte du devis DEV-2026-048")
    for (const item of (inv.items || [])) {
      const m = (item.title || '').match(/DEV-\d{4}-\d+/);
      if (m) {
        const devNum = m[0];
        if (!invoicesByDevis[devNum]) invoicesByDevis[devNum] = [];
        invoicesByDevis[devNum].push(inv);
        break;
      }
    }
  }

  const clientQuotes = (qData.quotes || [])
    .filter(q => q.client_id === client.id || q.client?.id === client.id)
    .filter(q => q.status !== 'canceled');

  const quotes = clientQuotes.map(q => {
    const total = parseFloat(q.total_amount?.value || 0);

    // Chercher les factures liées : par UUID ou par numéro de devis
    const linked = invoicesByDevis[q.id] || invoicesByDevis[q.number] || [];

    const paidInvoices    = linked.filter(i => i.status === 'paid');
    const pendingInvoices = linked.filter(i => ['unpaid', 'pending'].includes(i.status));

    const paidAmount    = paidInvoices.reduce((s, i) => s + parseFloat(i.total_amount?.value || 0), 0);
    const pendingAmount = pendingInvoices.reduce((s, i) => s + parseFloat(i.total_amount?.value || 0), 0);
    const remaining     = Math.max(0, total - paidAmount);

    return {
      id: q.id,
      number: q.number,
      status: q.status,
      total,
      currency: q.total_amount?.currency || 'EUR',
      issue_date: q.issue_date,
      header: q.header || '',
      quote_url: q.quote_url || null,
      // Paiements
      paidAmount,
      pendingAmount,
      remaining,
      invoices: linked.map(i => ({
        number: i.number,
        status: i.status,
        type: i.invoice_type,
        amount: parseFloat(i.total_amount?.value || 0),
        paid_at: i.paid_at || null,
      })),
    };
  });

  const isCompany = client.type === 'company';

  return NextResponse.json({
    quotes,
    clientFound: true,
    clientType: client.type || 'individual',
    // Entreprise : name = raison sociale, first/last = contact
    companyName: isCompany ? (client.name || '') : '',
    firstName:   client.first_name || '',
    lastName:    isCompany
      ? (client.last_name || '')
      : (client.last_name || client.name || ''),
    phone: client.phone
      ? `+${(client.phone.country_code || '33').replace('+', '')}${client.phone.number}`
      : '',
  });
}
