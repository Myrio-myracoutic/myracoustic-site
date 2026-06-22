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

// GET /api/mon-espace/facturation/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier que l'événement appartient au client connecté
  const supabase = getSupabase(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, qonto_quote_id, qonto_quote_url')
    .eq('id', eventId)
    .eq('client_id', client.id)
    .single();

  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });

  // Pas de devis Qonto lié
  if (!ev.qonto_quote_id) {
    return NextResponse.json({ quote: null, invoices: [] });
  }

  // Récupérer le devis + toutes les factures en parallèle
  const [qRes, invRes] = await Promise.all([
    fetch(`${QONTO_BASE}/quotes/${ev.qonto_quote_id}`, { headers: qHeaders() }),
    fetch(`${QONTO_BASE}/client_invoices?per_page=100`, { headers: qHeaders() }),
  ]);

  const quote     = qRes.ok     ? (await qRes.json()).quote           : null;
  const allInvs   = invRes.ok   ? (await invRes.json()).client_invoices : [];

  // Filtrer les factures liées à ce devis (par quote_id ou par numéro dans les lignes)
  const quoteNumber = quote?.number;
  const linked = allInvs.filter(i => {
    if (i.quote_id === ev.qonto_quote_id) return true;
    if (quoteNumber) {
      for (const item of (i.items || [])) {
        if ((item.title || '').includes(quoteNumber)) return true;
      }
    }
    return false;
  });

  const invoices = linked.map(i => ({
    id:         i.id,
    number:     i.number,
    status:     i.status,
    type:       i.invoice_type || i.type || null,
    amount:     fmtAmount(i.total_amount),
    currency:   i.total_amount?.currency || 'EUR',
    paid_at:    i.paid_at || null,
    issued_at:  i.issue_date || null,
    url:        i.invoice_url || i.public_url || i.file_url || null,
  }));

  return NextResponse.json({
    quote: quote ? {
      id:     quote.id,
      number: quote.number,
      total:  fmtAmount(quote.total_amount),
      url:    ev.qonto_quote_url || quote.quote_url || null,
    } : null,
    invoices,
  });
}
