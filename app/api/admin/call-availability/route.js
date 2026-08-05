import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { getAvailableSlots, isDateInBookingWindow, ADMIN_BOOKING_WINDOW_DAYS } from '@/lib/call-slots';

export const dynamic = 'force-dynamic';

// GET /api/admin/call-availability?date=YYYY-MM-DD — créneaux dispo pour programmer/modifier
// un appel depuis l'admin. Fenêtre plus large que le tunnel public (ADMIN_BOOKING_WINDOW_DAYS).
export async function GET(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'date requise (YYYY-MM-DD)' }, { status: 400 });
  }
  if (!isDateInBookingWindow(date, ADMIN_BOOKING_WINDOW_DAYS)) {
    return Response.json({ error: 'Date hors de la fenêtre autorisée' }, { status: 400 });
  }

  const slots = await getAvailableSlots(date, ADMIN_BOOKING_WINDOW_DAYS);
  return Response.json({ slots });
}
