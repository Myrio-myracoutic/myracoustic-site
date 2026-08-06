import { NextResponse } from 'next/server';
import { runLeadMagnetSequence } from '@/app/lib/run-lead-magnet-sequence';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-08-06_lead_magnet_sequence.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runLeadMagnetSequence();
  return NextResponse.json({ ok: true, ...res });
}
