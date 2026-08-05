import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getCalendarClient, getCalendarId } from '@/lib/google-calendar';
import { addMinutesToTime, parisLocalToUtcISO } from '@/lib/paris-time';
import { getAvailableSlots, isDateInBookingWindow, getSlotDurationMinutes } from '@/lib/call-slots';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

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

  // Revalidation serveur : jamais confiance à ce que le client a affiché.
  const slots = await getAvailableSlots(date);
  if (!slots.includes(time)) {
    return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
  }

  const isoStart = parisLocalToUtcISO(date, time);
  const slotMinutes = await getSlotDurationMinutes();

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('mariage_leads')
    .update({ call_scheduled_at: isoStart, call_duration_minutes: slotMinutes })
    .eq('id', leadId)
    .is('call_scheduled_at', null)
    .select('id, prenom, nom, tel, email, event_date, lieu, guests, message')
    .maybeSingle();

  if (updateErr) {
    if (updateErr.code === '23505') {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'lead_already_booked' }, { status: 409 });
  }

  // Événement Google Calendar : best-effort. Si ça échoue, la réservation en base
  // reste valide (comme /api/leads/mariage qui ne perd jamais un lead pour une
  // panne d'email) — un admin peut recréer l'événement à la main si besoin.
  try {
    const calendar = getCalendarClient();
    const calId = getCalendarId();
    const endTime = addMinutesToTime(time, slotMinutes);
    const description = [
      `Tél : ${updated.tel}`,
      `Email : ${updated.email}`,
      updated.event_date ? `Date de mariage envisagée : ${fmtDate(updated.event_date)}` : null,
      updated.lieu ? `Lieu : ${updated.lieu}` : null,
      updated.guests ? `Invités : ${updated.guests}` : null,
      updated.message ? `Message : ${updated.message}` : null,
    ].filter(Boolean).join('\n');

    const evRes = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary: `📞 Appel — ${updated.prenom} ${updated.nom} (mariage)`,
        description,
        start: { dateTime: `${date}T${time}:00`, timeZone: 'Europe/Paris' },
        end:   { dateTime: `${date}T${endTime}:00`, timeZone: 'Europe/Paris' },
        status: 'confirmed',
        transparency: 'opaque',
        extendedProperties: { private: { mariage_lead_id: leadId, kind: 'call_appointment' } },
      },
    });

    await supabaseAdmin
      .from('mariage_leads')
      .update({ call_google_event_id: evRes.data.id })
      .eq('id', leadId);
  } catch (err) {
    console.error('call booking calendar event error:', err.message);
  }

  return NextResponse.json({ ok: true, date, time });
}
