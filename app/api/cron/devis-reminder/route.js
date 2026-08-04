import { NextResponse } from 'next/server';
import { runDevisReminders } from '@/app/lib/run-devis-reminders';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-08-04_devis_reminder_auto.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runDevisReminders();
  return NextResponse.json({ ok: true, ...res });
}
