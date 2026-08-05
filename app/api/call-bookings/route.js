import { NextResponse } from 'next/server';
import { isDateInBookingWindow } from '@/lib/call-slots';
import { bookCallSlot } from '@/app/lib/call-booking';

export const dynamic = 'force-dynamic';

// POST /api/call-bookings — { leadId, date, time } → réserve un créneau d'appel
// (durée réglable dans /admin/planning-appels).
export async function POST(request) {
  const { leadId, date, time } = await request.json();

  if (!leadId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  if (!isDateInBookingWindow(date)) {
    return NextResponse.json({ error: 'Date hors de la fenêtre de réservation' }, { status: 400 });
  }

  const result = await bookCallSlot({ leadId, date, time, requireEmptySlot: true });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
