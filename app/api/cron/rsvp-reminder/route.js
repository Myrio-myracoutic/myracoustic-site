import { NextResponse } from 'next/server';
import { runRsvpReminders } from '@/app/lib/run-rsvp-reminders';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Vérification du secret cron
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runRsvpReminders();
  return NextResponse.json({ ok: true, ...res });
}
