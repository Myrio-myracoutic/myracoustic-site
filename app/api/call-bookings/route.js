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

// "mardi 4 août 2026 à 9h15" (ou "9h" si l'heure tombe pile)
function fmtSlotDateTime(date, time) {
  let dateLabel = date;
  try {
    dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { /* garde la date brute */ }
  const [h, m] = time.split(':');
  const heureLabel = m === '00' ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`;
  return `${dateLabel} à ${heureLabel}`;
}

function buildCallConfirmEmail({ firstName, slotLabel, tel }) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 24px;line-height:1.3;">Votre appel est confirmé 📞</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
      <tr><td style="background:rgba(184,239,11,0.08);border:1px solid rgba(184,239,11,0.3);border-radius:8px;padding:16px 20px;">
        <p style="color:#b8ef0b;font-size:16px;font-weight:700;margin:0;text-transform:capitalize;">${slotLabel}</p>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin:0;">
      Un conseiller Myracoustic vous appellera au <strong>${tel}</strong> pour échanger sur votre projet de mariage. Merci d'être disponible à ce moment-là.
    </p>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.7;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

async function sendCallConfirmEmail({ toEmail, firstName, tel, slotLabel }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: 'contact@myracoustic.com' },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: 'contact@myracoustic.com', name: 'Myracoustic' },
      subject: `Votre appel est confirmé — ${slotLabel}`,
      htmlContent: buildCallConfirmEmail({ firstName, slotLabel, tel }),
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
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

  // Email de confirmation du créneau : best-effort, comme l'événement Google
  // ci-dessus — la réservation est déjà actée en base quoi qu'il arrive.
  try {
    await sendCallConfirmEmail({
      toEmail: updated.email,
      firstName: updated.prenom,
      tel: updated.tel,
      slotLabel: fmtSlotDateTime(date, time),
    });
  } catch (err) {
    console.error('call booking confirm email error:', err.message);
  }

  return NextResponse.json({ ok: true, date, time });
}
