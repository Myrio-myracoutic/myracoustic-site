/**
 * Tidal API client
 *
 * Search  → API officielle (Client Credentials, stable)
 * Playlist → API interne non-officielle (token OAuth de Myrio stocké en env)
 *
 * Variables d'environnement requises :
 *   TIDAL_CLIENT_ID        → ID de l'app developer.tidal.com
 *   TIDAL_CLIENT_SECRET    → Secret de l'app developer.tidal.com
 *   TIDAL_USER_ID          → ID du compte Tidal de Myrio
 *   TIDAL_ACCESS_TOKEN     → Token OAuth actuel (mis à jour par le script de refresh)
 *   TIDAL_REFRESH_TOKEN    → Refresh token OAuth (obtenu via Device Code Flow)
 *   TIDAL_COUNTRY_CODE     → Pays (ex: FR)
 */

const TIDAL_AUTH_URL    = 'https://auth.tidal.com/v1/oauth2';
const TIDAL_OFFICIAL    = 'https://openapi.tidal.com/v2';
const TIDAL_INTERNAL    = 'https://api.tidal.com/v1';
const COUNTRY           = process.env.TIDAL_COUNTRY_CODE || 'FR';

// ─── Token Client Credentials (pour la recherche officielle) ──────────────

let _ccToken = null;
let _ccExpires = 0;

async function getClientCredentialsToken() {
  if (_ccToken && Date.now() < _ccExpires - 30_000) return _ccToken;

  const creds = Buffer.from(
    `${process.env.TIDAL_CLIENT_ID}:${process.env.TIDAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${TIDAL_AUTH_URL}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=playlists.read+collection.read',
  });

  if (!res.ok) throw new Error(`Tidal CC token error: ${res.status}`);
  const data = await res.json();
  _ccToken   = data.access_token;
  _ccExpires = Date.now() + data.expires_in * 1000;
  return _ccToken;
}

// ─── Token utilisateur (pour les playlists) ───────────────────────────────
// Tidal ne fournit pas de refresh_token pour les apps tierces.
// Le token (4h) est stocké dans la table `settings` (clé: tidal_access_token + tidal_token_expires_at).
// L'admin le renouvelle via le bouton "Connecter Tidal" dans l'interface.
// En dev, on peut aussi le passer via TIDAL_ACCESS_TOKEN dans .env.local.

import { createClient } from '@supabase/supabase-js';

let _userToken   = null;
let _userExpires = 0;

async function getUserToken() {
  if (_userToken && Date.now() < _userExpires - 30_000) return _userToken;

  // 1. Essaye la variable d'env (dev / premier démarrage)
  if (process.env.TIDAL_ACCESS_TOKEN) {
    _userToken   = process.env.TIDAL_ACCESS_TOKEN;
    _userExpires = Date.now() + 14400 * 1000;
    return _userToken;
  }

  // 2. Lit depuis Supabase settings
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'tidal_access_token')
    .single();

  if (!data?.value) throw new Error('TOKEN_EXPIRED');

  const { data: exp } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'tidal_token_expires_at')
    .single();

  const expiresAt = exp?.value ? Number(exp.value) : 0;
  if (Date.now() > expiresAt - 30_000) throw new Error('TOKEN_EXPIRED');

  _userToken   = data.value;
  _userExpires = expiresAt;
  return _userToken;
}

// ─── Recherche officielle ──────────────────────────────────────────────────

/**
 * Recherche des titres dans le catalogue Tidal.
 * @param {string} query  ex: "Perfect Ed Sheeran"
 * @param {number} limit  nombre de résultats (max 50)
 * @returns {Array} liste de tracks { id, title, artist, album, duration, url }
 */
export async function searchTracks(query, limit = 10) {
  const token = await getClientCredentialsToken();

  const url = new URL(`${TIDAL_OFFICIAL}/searchresults/${encodeURIComponent(query)}/relationships/tracks`);
  url.searchParams.set('countryCode', COUNTRY);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', '0');

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Tidal search error: ${res.status}`);
  const data = await res.json();

  // Normalise la réponse (format JSON:API)
  return (data.data || []).map(item => {
    const attrs = item.attributes || {};
    const artistRel = item.relationships?.artists?.data?.[0];
    const artistIncluded = (data.included || []).find(
      i => i.type === 'artists' && i.id === artistRel?.id
    );
    return {
      id:       item.id,
      title:    attrs.title || '',
      artist:   artistIncluded?.attributes?.name || '',
      album:    attrs.album?.title || '',
      duration: attrs.duration || 0,
      url:      `https://tidal.com/browse/track/${item.id}`,
    };
  });
}

// ─── Gestion des playlists (API interne) ──────────────────────────────────

/**
 * Crée une playlist dans le compte Tidal de Myrio.
 * @param {string} name        Nom de la playlist
 * @param {string} description Description (optionnelle)
 * @returns {string} UUID de la playlist créée
 */
export async function createTidalPlaylist(name, description = '') {
  const token  = await getUserToken();
  const userId = process.env.TIDAL_USER_ID;

  const res = await fetch(`${TIDAL_INTERNAL}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'X-Tidal-Token': process.env.TIDAL_CLIENT_ID,
    },
    body: JSON.stringify({ title: name, description }),
  });

  if (!res.ok) throw new Error(`Tidal createPlaylist error: ${res.status}`);
  const data = await res.json();
  return data.uuid;
}

/**
 * Ajoute des titres à une playlist Tidal existante.
 * @param {string}   playlistUuid UUID de la playlist
 * @param {string[]} trackIds     IDs Tidal des titres à ajouter
 */
export async function addTracksToTidalPlaylist(playlistUuid, trackIds) {
  if (!trackIds.length) return;
  const token = await getUserToken();

  const res = await fetch(`${TIDAL_INTERNAL}/playlists/${playlistUuid}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization':    `Bearer ${token}`,
      'Content-Type':     'application/json',
      'X-Tidal-Token':    process.env.TIDAL_CLIENT_ID,
      'If-None-Match':    '*',
    },
    body: JSON.stringify({
      trackIds,
      toIndex: 0,
    }),
  });

  if (!res.ok) throw new Error(`Tidal addTracks error: ${res.status}`);
}

/**
 * Supprime une playlist Tidal.
 * @param {string} playlistUuid UUID de la playlist à supprimer
 */
export async function deleteTidalPlaylist(playlistUuid) {
  const token = await getUserToken();

  await fetch(`${TIDAL_INTERNAL}/playlists/${playlistUuid}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tidal-Token': process.env.TIDAL_CLIENT_ID,
    },
  });
}
