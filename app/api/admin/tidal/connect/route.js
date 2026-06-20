import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const CLIENT_ID    = process.env.TIDAL_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/tidal/callback`;
const SCOPES       = 'playlists.read playlists.write collection.read collection.write user.read';

export async function GET() {
  const codeVerifier  = crypto.randomBytes(64).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state         = crypto.randomBytes(16).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set('tidal_pkce_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' });
  cookieStore.set('tidal_pkce_state',    state,         { httpOnly: true, maxAge: 600, path: '/' });

  const url = new URL('https://login.tidal.com/authorize');
  url.searchParams.set('response_type',         'code');
  url.searchParams.set('client_id',             CLIENT_ID);
  url.searchParams.set('redirect_uri',          REDIRECT_URI);
  url.searchParams.set('scope',                 SCOPES);
  url.searchParams.set('code_challenge',        codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state',                 state);

  return NextResponse.redirect(url.toString());
}
