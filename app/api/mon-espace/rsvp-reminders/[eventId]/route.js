import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';
import { sendRsvpReminderEmail } from '@/app/lib/rsvp-reminder-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

/* PATCH — activer / désactiver les relances RSVP automatiques pour cet événement */
export async function PATCH(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { enabled } = await request.json();
  const { error } = await supabaseAdmin
    .from('events')
    .update({ rsvp_reminder_enabled: !!enabled })
    .eq('id', eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, enabled: !!enabled });
}

/* POST — relancer maintenant tous les invités sans réponse (déclenché par le couple) */
export async function POST(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, event_type, clients(first_name)')
    .eq('id', eventId)
    .single();

  const { data: guests } = await supabaseAdmin
    .from('event_guests')
    .select('id, email, first_name, token')
    .eq('event_id', eventId)
    .is('attending', null)
    .not('email', 'is', null);

  let sent = 0;
  for (const g of (guests || [])) {
    try {
      await sendRsvpReminderEmail({
        toEmail: g.email,
        firstName: g.first_name,
        inviteLink: `${APP_URL}/invitation/${g.token}`,
        eventType: ev?.event_type,
        clientFirstName: ev?.clients?.first_name || 'Votre hôte',
      });
      await supabaseAdmin
        .from('event_guests')
        .update({ rsvp_reminder_sent_at: new Date().toISOString() })
        .eq('id', g.id);
      sent++;
    } catch { /* on continue avec les autres invités */ }
  }

  return NextResponse.json({ ok: true, sent });
}
