import { NextResponse } from 'next/server';
import { runMilestoneAdminReminders } from '@/app/lib/run-milestone-admin-reminders';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-09-14_event_milestones_reminder_cron.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runMilestoneAdminReminders();
  return NextResponse.json({ ok: true, ...res });
}
