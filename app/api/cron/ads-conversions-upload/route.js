import { NextResponse } from 'next/server';
import { runAdsConversionsUpload } from '@/app/lib/run-ads-conversions-upload';

export const dynamic = 'force-dynamic';

// Appelée par pg_cron (Supabase), pas par Vercel — voir supabase-migrations/2026-11-03_ads_conversions_upload.sql
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const res = await runAdsConversionsUpload();
  return NextResponse.json({ ok: true, ...res });
}
