import { NextResponse } from 'next/server';
import { isDateInBookingWindow } from '@/lib/call-slots';
import { bookCallSlot } from '@/app/lib/call-booking';

export const dynamic = 'force-dynamic';

// POST /api/call-bookings — { kind, refId, date, time } → réserve un créneau d'appel
// (durée réglable dans /admin/planning-appels). kind : 'mariage' (défaut, compat leadId),
// 'devis' (particulier/pro ciblé) ou 'pro_contact'.
export async function POST(request) {
  const body = await request.json();
  const kind = body.kind || 'mariage';
  const refId = body.refId ?? body.leadId; // leadId = ancien nom, gardé pour compat
  const { date, time } = body;

  if (!refId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  if (!isDateInBookingWindow(date)) {
    return NextResponse.json({ error: 'Date hors de la fenêtre de réservation' }, { status: 400 });
  }

  const result = await bookCallSlot({ kind, refId, date, time, requireEmptySlot: true });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
