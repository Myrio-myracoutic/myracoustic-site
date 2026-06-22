import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function fmtAmount(v) {
  return parseFloat(v?.value || v || 0);
}

// Normalise un nom pour la comparaison (minuscules, espaces uniques)
function normName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// GET /api/mon-espace/facturation/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, first_name, last_name')
    .eq('auth_id', user.id)
    .single();
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, qonto_quote_id, qonto_quote_url, event_date')
    .eq('id', eventId)
    .eq('client_id', client.id)
    .single();
  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });

  if (!ev.qonto_quote_id) {
    return NextResponse.json({ quote: null, invoices: [], event_date: ev.event_date });
  }

  // Récupérer devis + toutes les factures en parallèle
  const [qRes, invRes] = await Promise.all([
    fetch(`${QONTO_BASE}/quotes/${ev.qonto_quote_id}`, { headers: qHeaders() }),
    fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() }),
  ]);

  const quote   = qRes.ok   ? (await qRes.json()).quote             : null;
  const allInvs = invRes.ok ? (await invRes.json()).client_invoices : [];

  const quoteNumber  = quote?.number; // ex: "DEV-2026-072"
  const clientQonto  = normName(`${client.first_name} ${client.last_name}`);
  const eventDateMs  = ev.event_date ? new Date(ev.event_date).getTime() : null;

  const linked = allInvs.filter(i => {
    // 1. Lien direct par quote_id (rarement renseigné par Qonto)
    if (i.quote_id === ev.qonto_quote_id) return true;

    // 2. Numéro du devis mentionné dans une ligne de facture (ex: acomptes)
    if (quoteNumber) {
      for (const item of (i.items || [])) {
        if ((item.title || '').includes(quoteNumber)) return true;
      }
    }

    // 3. Facture de solde : nom client + due_date proche de l'event_date (± 30 jours)
    if (i.invoice_type === 'balance' || i.type === 'balance') {
      const invClient = normName(i.client_name);
      if (invClient && invClient === clientQonto && eventDateMs && i.due_date) {
        const dueDiff = Math.abs(new Date(i.due_date).getTime() - eventDateMs);
        if (dueDiff <= 30 * 24 * 60 * 60 * 1000) return true;
      }
    }

    return false;
  });

  // Trier : acompte(s) en premier, solde en dernier
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
    pay_url:   i.invoice_url || null,    // lien de paiement Qonto pay.qonto.com
  }));

  return NextResponse.json({
    quote: quote ? {
      id:     quote.id,
      number: quote.number,
      total:  fmtAmount(quote.total_amount),
      url:    ev.qonto_quote_url || quote.quote_url || null,
    } : null,
    invoices,
    event_date: ev.event_date,
  });
}
