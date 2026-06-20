/**
 * Script de connexion Tidal (Authorization Code + PKCE) — à lancer une seule fois.
 *
 * Usage :
 *   TIDAL_CLIENT_ID=xxx TIDAL_CLIENT_SECRET=yyy node scripts/tidal-auth.mjs
 *
 * Prérequis : ajouter http://localhost:8888/callback comme Redirect URI
 * dans votre app sur developer.tidal.com
 */

import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';
import fs from 'fs';

const log = (msg) => {
  process.stdout.write(msg + '\n');
  fs.appendFileSync('/tmp/tidal-auth-debug.log', msg + '\n');
};

const CLIENT_ID     = process.env.TIDAL_CLIENT_ID;
const CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:8888/callback';
const AUTH_URL      = 'https://login.tidal.com/authorize';
const TOKEN_URL     = 'https://auth.tidal.com/v1/oauth2/token';
const SCOPES        = 'playlists.read playlists.write collection.read collection.write user.read';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Erreur : TIDAL_CLIENT_ID et TIDAL_CLIENT_SECRET requis.');
  process.exit(1);
}

// PKCE
const codeVerifier  = crypto.randomBytes(64).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
const state         = crypto.randomBytes(16).toString('hex');

const authUrl = new URL(AUTH_URL);
authUrl.searchParams.set('response_type',          'code');
authUrl.searchParams.set('client_id',              CLIENT_ID);
authUrl.searchParams.set('redirect_uri',           REDIRECT_URI);
authUrl.searchParams.set('scope',                  SCOPES);
authUrl.searchParams.set('code_challenge',         codeChallenge);
authUrl.searchParams.set('code_challenge_method',  'S256');
authUrl.searchParams.set('state',                  state);

console.log('\n─────────────────────────────────────────────');
console.log('  Connexion Tidal requise');
console.log('─────────────────────────────────────────────');
console.log('\n  Ouvrez ce lien dans votre navigateur :\n');
console.log(' ', authUrl.toString());
console.log('\n  En attente du callback…\n');

// Serveur local pour recevoir le code OAuth
const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:8888');

    // Ignore les requêtes qui ne sont pas le callback Tidal
    if (url.pathname !== '/callback') {
      res.writeHead(204);
      res.end();
      return;
    }

    const code     = url.searchParams.get('code');
    const retState = url.searchParams.get('state');
    const error    = url.searchParams.get('error');

    if (error) {
      res.end('<h2>Erreur : ' + error + '</h2><p>Vous pouvez fermer cet onglet.</p>');
      server.close();
      reject(new Error('Tidal auth error: ' + error));
      return;
    }

    if (retState !== state) {
      res.end('<h2>Erreur : state invalide</h2>');
      server.close();
      reject(new Error('State mismatch'));
      return;
    }

    res.end('<h2 style="font-family:sans-serif;color:green">✓ Connexion réussie !</h2><p>Vous pouvez fermer cet onglet.</p>');
    server.close();
    resolve(code);
  });

  server.listen(8888);
  server.on('error', reject);
});

// Échange du code contre les tokens
log('\n[DEBUG] Échange du code contre les tokens…');
const creds  = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

let tokenData;
try {
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
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
  const raw = await tokenRes.text();
  log(`[DEBUG] Token HTTP ${tokenRes.status}: ${raw}`);
  tokenData = JSON.parse(raw);
} catch (e) {
  log('[ERROR] Token exchange failed: ' + e.message);
  process.exit(1);
}

// Récupère le userId via /v1/sessions
log('[DEBUG] Récupère session Tidal v1…');
let meData = {};
try {
  const meRes = await fetch('https://api.tidal.com/v1/sessions', {
    signal: AbortSignal.timeout(10000),
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });
  const meTxt = await meRes.text();
  log(`[DEBUG] /v1/sessions HTTP ${meRes.status}: ${meTxt}`);
  meData = JSON.parse(meTxt);
} catch (e) {
  log('[WARN] /v1/sessions failed: ' + e.message);
}

const userId       = meData.userId  || tokenData.sub || tokenData.user_id || '?';
const countryCode  = meData.countryCode || 'FR';
const refreshToken = tokenData.refresh_token || '?';

log('\n─────────────────────────────────────────────');
log('  Connexion réussie ! Copiez ces valeurs dans .env.local et Vercel :');
log('─────────────────────────────────────────────\n');
log(`TIDAL_REFRESH_TOKEN=${refreshToken}`);
log(`TIDAL_USER_ID=${userId}`);
log(`TIDAL_COUNTRY_CODE=${countryCode}`);
log('\n─────────────────────────────────────────────\n');
