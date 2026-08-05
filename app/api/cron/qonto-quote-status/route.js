import { NextResponse } from 'next/server';
import { runQontoQuoteStatus } from '@/app/lib/run-qonto-quote-status';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-08-05_qonto_quotes_tracking.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runQontoQuoteStatus();
  return NextResponse.json({ ok: true, ...res });
}
