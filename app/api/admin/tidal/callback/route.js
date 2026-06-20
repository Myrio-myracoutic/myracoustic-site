import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID     = process.env.TIDAL_CLIENT_ID;
const CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET;
const TOKEN_URL     = 'https://auth.tidal.com/v1/oauth2/token';
const REDIRECT_URI  = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/tidal/callback`;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get('code');
  const state    = searchParams.get('state');
  const error    = searchParams.get('error');

  const cookieStore = await cookies();
  const savedState    = cookieStore.get('tidal_pkce_state')?.value;
  const codeVerifier  = cookieStore.get('tidal_pkce_verifier')?.value;

  if (error)          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?tidal=error&reason=${error}`);
  if (state !== savedState) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?tidal=error&reason=state_mismatch`);

  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Tidal callback token error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?tidal=error&reason=token_exchange`);
  }

  const tokenData  = await tokenRes.json();
  const expiresAt  = Date.now() + tokenData.expires_in * 1000;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from('settings').upsert([
    { key: 'tidal_access_token',    value: tokenData.access_token, updated_at: new Date().toISOString() },
    { key: 'tidal_token_expires_at', value: String(expiresAt),      updated_at: new Date().toISOString() },
    { key: 'tidal_user_id',          value: String(tokenData.user_id || process.env.TIDAL_USER_ID), updated_at: new Date().toISOString() },
  ]);

  cookieStore.delete('tidal_pkce_verifier');
  cookieStore.delete('tidal_pkce_state');

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?tidal=connected`);
}
