import { NextResponse } from 'next/server';
import { runMariageBookingReminders } from '@/app/lib/run-booking-reminders';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-09-11_mariage_booking_reminder.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runMariageBookingReminders();
  return NextResponse.json({ ok: true, ...res });
}
