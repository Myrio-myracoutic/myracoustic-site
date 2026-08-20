import { NextResponse } from 'next/server';
import { resolveCallToken, bookCallSlot } from '@/app/lib/call-booking';
import { isDateInBookingWindow } from '@/lib/call-slots';

// Même fenêtre que le tunnel public (7 j, cf. lib/call-slots.js) — CallSlotPicker n'affiche
// de toute façon que 8 jours de sélecteur, pas la peine d'une fenêtre serveur plus large
// que ce que l'interface propose réellement.
const FIRST_NAME = {
  mariage: (r) => r.prenom,
  devis: (r) => r.client_first_name,
  pro_contact: (r) => r.prenom,
};
const TEL = {
  mariage: (r) => r.tel,
  devis: (r) => r.client_phone,
  pro_contact: (r) => r.tel,
};

// GET /api/rendez-vous/[token] — infos minimales pour afficher le sélecteur de créneau
// (jamais de données sensibles, juste de quoi personnaliser l'écran et l'appel POST).
export async function GET(request, { params }) {
  const { token } = await params;
  const resolved = await resolveCallToken(token);
  if (!resolved) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { kind, row } = resolved;
  return NextResponse.json({
    kind,
    firstName: (FIRST_NAME[kind] || FIRST_NAME.mariage)(row) || '',
    alreadyScheduled: row.call_scheduled_at && !row.call_cancelled_at ? row.call_scheduled_at : null,
  });
}

// POST /api/rendez-vous/[token] — { date, time } → réserve/reprogramme le créneau.
export async function POST(request, { params }) {
  const { token } = await params;
  const resolved = await resolveCallToken(token);
  if (!resolved) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { date, time } = await request.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  if (!isDateInBookingWindow(date)) {
    return NextResponse.json({ error: 'Date hors de la fenêtre de réservation' }, { status: 400 });
  }

  const isReschedule = !!resolved.row.call_scheduled_at && !resolved.row.call_cancelled_at;
  const result = await bookCallSlot({
    kind: resolved.kind, refId: resolved.refId, date, time,
    requireEmptySlot: false, isReschedule,
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
