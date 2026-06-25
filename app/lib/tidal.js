/**
 * Client API Tidal — API officielle v2 (openapi.tidal.com/v2), format JSON:API.
 *
 * Toutes les opérations (recherche catalogue, création de playlist, ajout de
 * titres) utilisent le token UTILISATEUR de Myrio, obtenu via le bouton
 * « Connecter Tidal » (flux Authorization Code) et stocké dans la table
 * `settings`. Tidal ne fournit pas de refresh_token aux apps tierces : le token
 * dure 4h, l'admin le renouvelle via le bouton.
 *
 * Variables d'env : TIDAL_COUNTRY_CODE (def. FR), SUPABASE_URL/SERVICE_ROLE_KEY.
 * Fallback dev : TIDAL_ACCESS_TOKEN dans .env.local.
 */

import { createClient } from '@supabase/supabase-js';

const V2      = 'https://openapi.tidal.com/v2';
const COUNTRY = process.env.TIDAL_COUNTRY_CODE || 'FR';
const JSONAPI = 'application/vnd.api+json';

// ─── Token utilisateur ─────────────────────────────────────────────────────

let _userToken = null;
let _userExpires = 0;

async function getUserToken() {
  if (_userToken && Date.now() < _userExpires - 30_000) return _userToken;

  if (process.env.TIDAL_ACCESS_TOKEN) {
    _userToken   = process.env.TIDAL_ACCESS_TOKEN;
    _userExpires = Date.now() + 14400 * 1000;
    return _userToken;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['tidal_access_token', 'tidal_token_expires_at']);

  const token     = data?.find(d => d.key === 'tidal_access_token')?.value;
  const expiresAt = Number(data?.find(d => d.key === 'tidal_token_expires_at')?.value || 0);

  if (!token) throw new Error('TOKEN_EXPIRED');
  if (Date.now() > expiresAt - 30_000) throw new Error('TOKEN_EXPIRED');

  _userToken   = token;
  _userExpires = expiresAt;
  return _userToken;
}

function authHeaders(write = false) {
  return getUserToken().then(token => ({
    'Authorization': `Bearer ${token}`,
    'Accept':        JSONAPI,
    ...(write ? { 'Content-Type': JSONAPI } : {}),
  }));
}

// ─── Recherche catalogue ───────────────────────────────────────────────────

/**
 * Cherche le 1er titre Tidal correspondant à la requête.
 * @returns {string|null} ID de track Tidal, ou null si rien trouvé.
 */
export async function resolveTrackId(query) {
  const headers = await authHeaders();
  const url = `${V2}/searchResults/${encodeURIComponent(query)}/relationships/tracks?countryCode=${COUNTRY}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1500));
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`Tidal search error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.id || null;
  }
  return null;
}

// ─── Playlists ─────────────────────────────────────────────────────────────

/**
 * Crée une playlist dans le compte Tidal de Myrio.
 * @returns {string} UUID de la playlist créée.
 */
export async function createTidalPlaylist(name, description = '') {
  const headers = await authHeaders(true);
  const body = JSON.stringify({
    data: { type: 'playlists', attributes: { name, description, accessType: 'UNLISTED' } },
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000));
    const res = await fetch(`${V2}/playlists?countryCode=${COUNTRY}`, {
      method: 'POST', headers, body, signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`Tidal createPlaylist error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.data?.id;
  }
  throw new Error('Tidal createPlaylist error: 429 (rate limit)');
}

/**
 * Lit les titres d'une playlist Tidal (suit la pagination).
 * @returns {Array} [{ tidalId, itemId }] dans l'ordre de la playlist.
 */
export async function getPlaylistItems(playlistId) {
  const headers = await authHeaders();
  const items = [];
  let url = `${V2}/playlists/${playlistId}/relationships/items?countryCode=${COUNTRY}`;
  while (url) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`Tidal getItems error: ${res.status}`);
    const data = await res.json();
    for (const d of (data.data || [])) {
      items.push({ tidalId: d.id, itemId: d.meta?.itemId });
    }
    url = data.links?.next ? `https://openapi.tidal.com/v2${data.links.next}` : null;
  }
  return items;
}

/**
 * Ajoute des titres (IDs Tidal) à une playlist, dans l'ordre fourni (par lots de 20).
 */
export async function addTracksToTidalPlaylist(playlistId, trackIds) {
  if (!trackIds.length) return;
  const headers = await authHeaders(true);
  for (let i = 0; i < trackIds.length; i += 20) {
    if (i > 0) await new Promise(r => setTimeout(r, 600));
    const chunk = trackIds.slice(i, i + 20);
    const body = JSON.stringify({ data: chunk.map(id => ({ id: String(id), type: 'tracks' })) });
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000));
      const res = await fetch(`${V2}/playlists/${playlistId}/relationships/items?countryCode=${COUNTRY}`, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) { lastErr = new Error(`Tidal addTracks error: 429`); continue; }
      if (!res.ok) throw new Error(`Tidal addTracks error: ${res.status} ${await res.text()}`);
      lastErr = null;
      break;
    }
    if (lastErr) throw lastErr;
  }
}

/**
 * Retire des titres d'une playlist Tidal.
 * @param {Array} items [{ tidalId, itemId }]
 */
export async function removeTracksFromTidalPlaylist(playlistId, items) {
  if (!items.length) return;
  const headers = await authHeaders(true);
  for (let i = 0; i < items.length; i += 20) {
    if (i > 0) await new Promise(r => setTimeout(r, 600));
    const chunk = items.slice(i, i + 20);
    const body = JSON.stringify({
      data: chunk.map(it => ({ id: String(it.tidalId), type: 'tracks', meta: { itemId: it.itemId } })),
    });
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000));
      const res = await fetch(`${V2}/playlists/${playlistId}/relationships/items?countryCode=${COUNTRY}`, {
        method: 'DELETE', headers, body, signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) { lastErr = new Error(`Tidal removeTracks error: 429`); continue; }
      if (!res.ok) throw new Error(`Tidal removeTracks error: ${res.status} ${await res.text()}`);
      lastErr = null;
      break;
    }
    if (lastErr) throw lastErr;
  }
}

/**
 * Supprime une playlist Tidal.
 */
export async function deleteTidalPlaylist(playlistId) {
  const headers = await authHeaders();
  await fetch(`${V2}/playlists/${playlistId}?countryCode=${COUNTRY}`, {
    method: 'DELETE', headers, signal: AbortSignal.timeout(15000),
  });
}

/** URL publique d'une playlist Tidal (pour ouvrir dans Serato / le navigateur). */
export function tidalPlaylistUrl(playlistId) {
  return `https://tidal.com/playlist/${playlistId}`;
}
