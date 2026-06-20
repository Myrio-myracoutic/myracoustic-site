import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: rows } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['tidal_access_token', 'tidal_token_expires_at']);

  const map = Object.fromEntries((rows || []).map(r => [r.key, r.value]));
  const expiresAt = map.tidal_token_expires_at ? Number(map.tidal_token_expires_at) : 0;
  const hasToken  = !!map.tidal_access_token;
  const isValid   = hasToken && Date.now() < expiresAt - 30_000;

  // Fallback env var (dev)
  const envToken = process.env.TIDAL_ACCESS_TOKEN;

  return NextResponse.json({
    connected: isValid || !!envToken,
    source:    isValid ? 'db' : (envToken ? 'env' : null),
    expiresAt: isValid ? expiresAt : null,
    expiresIn: isValid ? Math.round((expiresAt - Date.now()) / 1000) : null,
  });
}
