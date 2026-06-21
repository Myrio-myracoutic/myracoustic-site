/**
 * Recherche musicale via l'API publique Deezer.
 *
 * Choisie pour la recherche côté client car :
 *   - aucune authentification ni clé requise (l'app Tidal "third party"
 *     ne permet pas le grant client_credentials nécessaire à la recherche
 *     app-level, et le token utilisateur Tidal expire toutes les 4h)
 *   - catalogue complet, durée renvoyée en secondes
 *
 * Appelée uniquement côté serveur (route /api/music/search), donc pas de CORS.
 */

const DEEZER_API = 'https://api.deezer.com';

/**
 * Recherche des titres dans le catalogue Deezer.
 * @param {string} query  ex: "Perfect Ed Sheeran"
 * @param {number} limit  nombre de résultats (max 25)
 * @returns {Array} liste de tracks { id, title, artist, album, duration, cover, preview, url }
 */
export async function searchTracks(query, limit = 10) {
  const url = `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Deezer search error: ${res.status}`);

  const data = await res.json();
  return (data.data || []).map(t => ({
    id:       String(t.id),
    title:    t.title || '',
    artist:   t.artist?.name || '',
    album:    t.album?.title || '',
    duration: t.duration || 0,
    cover:    t.album?.cover_small || '',
    preview:  t.preview || '',   // extrait MP3 de 30s
    url:      t.link || '',
  }));
}
