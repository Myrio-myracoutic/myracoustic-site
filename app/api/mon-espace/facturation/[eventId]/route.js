import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, getSupabaseClient } from '@/app/lib/event-access';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function fmtAmount(v) {
  return parseFloat(v?.value || v || 0);
}

function normName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// GET /api/mon-espace/facturation/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  // Récupérer les infos de l'événement + client
  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, qonto_quote_id, qonto_quote_url, event_date, clients(first_name, last_name)')
    .eq('id', eventId)
    .single();

  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });

  if (!ev.qonto_quote_id) {
    return NextResponse.json({ quote: null, invoices: [], event_date: ev.event_date });
  }

  const [qRes, invRes] = await Promise.all([
    fetch(`${QONTO_BASE}/quotes/${ev.qonto_quote_id}`, { headers: qHeaders() }),
    fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() }),
  ]);

  const quote   = qRes.ok   ? (await qRes.json()).quote             : null;
  const allInvs = invRes.ok ? (await invRes.json()).client_invoices : [];

  // Le champ quote_url de Qonto pointe vers le portail privé (portal.qonto.com),
  // inaccessible au client. Le vrai PDF consultable passe par l'attachment :
  // on récupère une URL S3 signée (fraîche, valable ~30 min).
  let quotePdfUrl = null;
  if (quote?.attachment_id) {
    try {
      const aRes = await fetch(`${QONTO_BASE}/attachments/${quote.attachment_id}`, { headers: qHeaders() });
      if (aRes.ok) quotePdfUrl = (await aRes.json()).attachment?.url || null;
    } catch { /* PDF indisponible → lien simplement absent */ }
  }

  const quoteNumber  = quote?.number;
  const clientQonto  = normName(`${ev.clients?.first_name} ${ev.clients?.last_name}`);
  const eventDateMs  = ev.event_date ? new Date(ev.event_date).getTime() : null;

  const linked = allInvs.filter(i => {
    if (i.quote_id === ev.qonto_quote_id) return true;
    if (quoteNumber) {
      for (const item of (i.items || [])) {
        if ((item.title || '').includes(quoteNumber)) return true;
      }
    }
    if (i.invoice_type === 'balance' || i.type === 'balance') {
      const invClient = normName(i.client_name);
      if (invClient && invClient === clientQonto && eventDateMs && i.due_date) {
        const dueDiff = Math.abs(new Date(i.due_date).getTime() - eventDateMs);
        if (dueDiff <= 30 * 24 * 60 * 60 * 1000) return true;
      }
    }
    return false;
  });

  const typeOrder = { deposit: 0, balance: 1 };
  linked.sort((a, b) => (typeOrder[a.invoice_type] ?? 2) - (typeOrder[b.invoice_type] ?? 2));

  const invoices = linked.map(i => ({
    id:        i.id,
    number:    i.number,
    status:    i.status,
    type:      i.invoice_type || i.type || null,
    amount:    fmtAmount(i.total_amount),
    currency:  i.total_amount?.currency || 'EUR',
    paid_at:   i.paid_at || null,
    issued_at: i.issue_date || null,
    due_date:  i.due_date || null,
    pay_url:   i.invoice_url || null,
  }));

  return NextResponse.json({
    quote: quote ? {
      id:     quote.id,
      number: quote.number,
      total:  fmtAmount(quote.total_amount),
      url:    quotePdfUrl,   // PDF Qonto (S3 signé), null si indisponible
    } : null,
    invoices,
    event_date: ev.event_date,
  });
}
