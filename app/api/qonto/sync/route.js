import { NextResponse } from 'next/server';
import { runSync } from '@/lib/qonto-sync';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Sync error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
