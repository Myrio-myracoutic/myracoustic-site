import { NextResponse } from 'next/server';
import { getAvailableSlots, isDateInBookingWindow } from '@/lib/call-slots';

export const dynamic = 'force-dynamic';

// GET /api/call-availability?date=YYYY-MM-DD — public, créneaux d'appel dispo ce jour-là.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date requise (YYYY-MM-DD)' }, { status: 400 });
  }
  if (!isDateInBookingWindow(date)) {
    return NextResponse.json({ error: 'Date hors de la fenêtre de réservation' }, { status: 400 });
  }

  const slots = await getAvailableSlots(date);
  return NextResponse.json({ slots });
}
