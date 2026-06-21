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

  // Récupérer tous les devis et filtrer par client_id
  const qRes = await fetch(`${QONTO_BASE}/quotes?per_page=100`, { headers: qHeaders() });
  if (!qRes.ok) return NextResponse.json({ quotes: [], clientFound: true });
  const qData = await qRes.json();

  const quotes = (qData.quotes || [])
    .filter(q => q.client_id === client.id || q.client?.id === client.id)
    .filter(q => !['canceled'].includes(q.status))
    .map(q => ({
      id: q.id,
      number: q.number,
      status: q.status,
      amount: q.total_amount?.value,
      currency: q.total_amount?.currency || 'EUR',
      issue_date: q.issue_date,
      expiry_date: q.expiry_date,
      header: q.header || '',
      quote_url: q.quote_url || null,
    }));

  return NextResponse.json({ quotes, clientFound: true, clientName: client.name || `${client.first_name} ${client.last_name}` });
}
