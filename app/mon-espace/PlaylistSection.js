'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Music2, Search, Plus, X, ChevronDown, ChevronUp, Loader2, Play, Pause } from 'lucide-react';

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

function TrackRow({ track, token, onDelete }) {
  const [note, setNote]   = useState(track.note || '');
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  const saveNote = useCallback(async (val) => {
    setSaving(true);
    await fetch(`/api/mon-espace/playlists/tracks/${track.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ note: val }),
    });
    setSaving(false);
  }, [track.id, token]);

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(val), 800);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {track.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.cover_url} alt="" width={34} height={34}
          style={{ borderRadius: 8, flexShrink: 0, marginTop: 2, objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0, marginTop: 2,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Music2 size={14} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>{track.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{track.artist}</span>
          {track.album && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>· {track.album}</span>}
          {track.tidal_id && (
            <span style={{
              fontSize: 10, color: '#b8ef0b', background: 'rgba(184,239,11,0.08)',
              border: '1px solid rgba(184,239,11,0.2)', borderRadius: 4, padding: '1px 6px',
              fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.05em',
            }}>TIDAL</span>
          )}
        </div>
        <input
          type="text"
          value={note}
          onChange={handleNoteChange}
          placeholder="Ajouter une note (ex : chanson de la première danse)…"
          style={{
            marginTop: 6, width: '100%', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'inherit',
            outline: 'none', padding: 0,
          }}
        />
        {saving && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>enregistrement…</span>}
      </div>

      <button
        onClick={() => onDelete(track.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
          color: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 2,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function SearchBar({ playlistId, token, onAdded }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [adding, setAdding]   = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const searchTimer = useRef(null);
  const wrapRef = useRef(null);
  const audioRef = useRef(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  }, []);

  const togglePreview = (track) => {
    if (playingId === track.id) { stopPreview(); return; }
    stopPreview();
    if (!track.preview) return;
    const audio = new Audio(track.preview);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); stopPreview(); }
    };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); stopPreview(); };
  }, [stopPreview]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/music/search?q=${encodeURIComponent(val)}&limit=6`);
        const data = await res.json();
        setResults(data.tracks || []);
        setOpen(true);
      } catch {}
      setLoading(false);
    }, 400);
  };

  const addTrack = async (track) => {
    stopPreview();
    setAdding(track.id);
    await fetch('/api/mon-espace/playlists/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        playlist_id: playlistId,
        title:       track.title,
        artist:      track.artist,
        album:       track.album,
        deezer_id:   track.id,
        preview_url: track.preview,
        cover_url:   track.cover,
      }),
    });
    setAdding(null);
    setQuery('');
    setResults([]);
    setOpen(false);
    onAdded();
  };

  const addManual = async () => {
    const parts = query.split(' - ');
    const title  = parts[0]?.trim() || query.trim();
    const artist = parts[1]?.trim() || 'Inconnu';
    if (!title) return;
    setAdding('manual');
    await fetch('/api/mon-espace/playlists/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ playlist_id: playlistId, title, artist }),
    });
    setAdding(null);
    setQuery('');
    setResults([]);
    setOpen(false);
    onAdded();
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', marginTop: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px',
      }}>
        {loading
          ? <Loader2 size={15} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          : <Search size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
        }
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Rechercher un titre ou un artiste…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, fontFamily: 'inherit',
          }}
        />
        {query.trim() && (
          <button
            onClick={addManual}
            disabled={adding === 'manual'}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >+ Ajouter manuellement</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, marginTop: 4, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map(track => (
            <div
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <button
                onClick={() => togglePreview(track)}
                disabled={!track.preview}
                title={track.preview ? 'Écouter un extrait (30s)' : 'Extrait indisponible'}
                style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none',
                  cursor: track.preview ? 'pointer' : 'not-allowed',
                  background: playingId === track.id ? '#b8ef0b' : 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {playingId === track.id
                  ? <Pause size={13} color="#060e16" fill="#060e16" />
                  : <Play size={13} color="#b8ef0b" fill="#b8ef0b" style={{ marginLeft: 1 }} />
                }
              </button>

              <button
                onClick={() => addTrack(track)}
                disabled={adding === track.id}
                style={{
                  flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {track.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.cover} alt="" width={34} height={34}
                    style={{ borderRadius: 6, flexShrink: 0, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artist}{track.album ? ` · ${track.album}` : ''}
                  </div>
                </div>
                {track.duration ? <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, flexShrink: 0 }}>{fmtDuration(track.duration)}</span> : null}
                {adding === track.id
                  ? <Loader2 size={14} color="#b8ef0b" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  : <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      background: 'rgba(184,239,11,0.12)', border: '1px solid rgba(184,239,11,0.25)',
                      color: '#b8ef0b', borderRadius: 6, padding: '4px 10px',
                      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display), sans-serif',
                    }}>
                      <Plus size={12} /> Ajouter
                    </span>
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistCard({ playlist, token, onRefresh }) {
  const [open, setOpen] = useState(false);

  const deleteTrack = async (trackId) => {
    await fetch(`/api/mon-espace/playlists/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    onRefresh();
  };

  const tracks = playlist.playlist_tracks || [];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, marginBottom: 10, position: 'relative',
      zIndex: open ? 10 : 1,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Music2 size={16} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, textAlign: 'left' }}>
            {playlist.name}
          </span>
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '2px 8px',
            flexShrink: 0,
          }}>{tracks.length} titre{tracks.length !== 1 ? 's' : ''}</span>
        </div>
        {open
          ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          {tracks.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: '0 0 12px', fontStyle: 'italic' }}>
              Aucun titre pour l'instant — utilisez la recherche ci-dessous.
            </p>
          )}
          {tracks.map(track => (
            <TrackRow key={track.id} track={track} token={token} onDelete={deleteTrack} />
          ))}
          <SearchBar playlistId={playlist.id} token={token} onAdded={onRefresh} />
        </div>
      )}
    </div>
  );
}

export default function PlaylistSection({ eventId, token }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Rafraîchit les données sans toucher à l'état de chargement :
  // les cartes restent montées, donc leur état « ouvert » est préservé.
  const refresh = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/playlists/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setPlaylists(data.playlists || []);
  }, [eventId, token]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
      Chargement des playlists…
    </div>
  );

  if (playlists.length === 0) return null;

  const totalTracks = playlists.reduce((s, p) => s + (p.playlist_tracks?.length || 0), 0);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
          }}>Mes playlists musicales</h3>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            {totalTracks} titre{totalTracks !== 1 ? 's' : ''} ajouté{totalTracks !== 1 ? 's' : ''}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>
          Ajoutez vos titres préférés dans chaque playlist. Recherchez un titre, écoutez un extrait, puis ajoutez-le — ou saisissez-le manuellement.
        </p>
        {playlists.map(pl => (
          <PlaylistCard key={pl.id} playlist={pl} token={token} onRefresh={refresh} />
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
