'use client';
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Music2, Search, Plus, X, ChevronDown, ChevronUp, Loader2, Play, Pause, Check, ThumbsUp, ThumbsDown, Pencil, Trash2, Gift, ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonPlaylist } from './SkeletonLoader';

// Singleton audio : un seul morceau joue à la fois dans toute la section playlist
let _globalAudio = null;
let _globalStop = null;
function stopGlobalAudio() {
  if (_globalAudio) { _globalAudio.pause(); _globalAudio = null; }
  if (_globalStop)  { _globalStop(false);  _globalStop  = null; }
}
function registerGlobalAudio(audio, setPlaying) {
  stopGlobalAudio();
  _globalAudio = audio;
  _globalStop  = setPlaying;
}

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

const TrackRow = memo(function TrackRow({ track, token, onDelete, onMove, index, total }) {
  const [note, setNote]         = useState(track.note || '');
  const [saving, setSaving]     = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const saveTimer = useRef(null);

  // Nettoyage à la suppression du composant
  useEffect(() => () => {
    if (_globalAudio && _globalStop === setPlaying) stopGlobalAudio();
  }, []);

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

  const canPreview = !!(track.preview_url || track.deezer_id);

  const togglePlay = async () => {
    // Déjà en lecture → on arrête
    if (playing) { stopGlobalAudio(); setPlaying(false); return; }

    setLoadingPlay(true);

    // Toujours récupérer une URL d'extrait fraîche via deezer_id (évite les
    // URLs Deezer expirées) ; repli sur preview_url si pas de deezer_id.
    let url = '';
    if (track.deezer_id) {
      try {
        const res  = await fetch(`/api/music/preview?deezer_id=${encodeURIComponent(track.deezer_id)}`);
        const data = await res.json();
        url = data.preview || '';
      } catch { url = ''; }
    }
    if (!url) url = track.preview_url || '';

    setLoadingPlay(false);
    if (!url) return;

    const audio = new Audio(url);
    audio.onended = () => { _globalAudio = null; _globalStop = null; setPlaying(false); };
    audio.onerror = () => { _globalAudio = null; _globalStop = null; setPlaying(false); };

    registerGlobalAudio(audio, setPlaying);
    audio.play().catch(() => { _globalAudio = null; _globalStop = null; setPlaying(false); });
    // État mis à jour tout de suite → le bouton passe en Pause immédiatement
    setPlaying(true);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Bouton play */}
      {canPreview ? (
        <button
          onClick={togglePlay}
          disabled={loadingPlay}
          title={playing ? 'Arrêter' : 'Écouter un extrait (30s)'}
          style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none',
            marginTop: 2, cursor: 'pointer',
            background: playing ? '#b8ef0b' : 'rgba(184,239,11,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            opacity: loadingPlay ? 0.5 : 1,
          }}
        >
          {loadingPlay
            ? <Loader2 size={12} color="#b8ef0b" style={{ animation: 'spin 0.8s linear infinite' }} />
            : playing
              ? <Pause size={12} color="#060e16" fill="#060e16" />
              : <Play size={12} color="#b8ef0b" fill="#b8ef0b" style={{ marginLeft: 1 }} />
          }
        </button>
      ) : (
        /* Placeholder de même taille pour que la grille reste alignée */
        <div style={{ width: 30, height: 30, flexShrink: 0, marginTop: 2 }}>
          {track.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.cover_url} alt="" width={30} height={30}
              style={{ borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Music2 size={12} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
            </div>
          )}
        </div>
      )}

      {/* Pochette à côté du bouton play (seulement quand play existe) */}
      {canPreview && track.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.cover_url} alt="" width={30} height={30}
          style={{ borderRadius: 6, flexShrink: 0, marginTop: 2, objectFit: 'cover' }} />
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

      {/* Réordonner : monter / descendre */}
      {onMove && total > 1 && (() => {
        const isFirst = index === 0;
        const isLast  = index === total - 1;
        const arrowBtn = (dir, disabled, Icon) => (
          <button
            onClick={() => onMove(track.id, dir)}
            disabled={disabled}
            title={dir === 'up' ? 'Monter' : 'Descendre'}
            style={{
              background: 'none', border: 'none', padding: '2px 4px', lineHeight: 0,
              cursor: disabled ? 'default' : 'pointer',
              color: disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = '#b8ef0b'; }}
            onMouseLeave={e => { e.currentTarget.style.color = disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)'; }}
          >
            <Icon size={14} />
          </button>
        );
        return (
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, marginTop: 2 }}>
            {arrowBtn('up', isFirst, ArrowUp)}
            {arrowBtn('down', isLast, ArrowDown)}
          </div>
        );
      })()}

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
});

function SearchBar({ playlistId, token, onAdded }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [adding, setAdding]   = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [dropStyle, setDropStyle] = useState({});
  const searchTimer = useRef(null);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  const stopPreview = useCallback(() => {
    if (_globalAudio && _globalStop === setPlayingId) stopGlobalAudio();
    setPlayingId(null);
  }, []);

  const togglePreview = (track) => {
    if (playingId === track.id) { stopGlobalAudio(); setPlayingId(null); return; }
    stopGlobalAudio();
    if (!track.preview) return;
    const audio = new Audio(track.preview);
    audio.onended = () => { _globalAudio = null; _globalStop = null; setPlayingId(null); };
    audio.play().catch(() => setPlayingId(null));
    registerGlobalAudio(audio, setPlayingId);
    setPlayingId(track.id);
  };

  const computeDropStyle = useCallback(() => {
    if (!wrapRef.current) return {};
    const rect = wrapRef.current.getBoundingClientRect();
    const viewH = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = viewH - rect.bottom;
    return {
      position: 'fixed',
      left: rect.left, width: rect.width, zIndex: 9999,
      ...(spaceBelow < 300
        ? { bottom: viewH - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const inWrap = wrapRef.current && wrapRef.current.contains(e.target);
      const inDrop = dropRef.current && dropRef.current.contains(e.target);
      if (!inWrap && !inDrop) { setOpen(false); stopPreview(); }
    };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); stopPreview(); };
  }, [stopPreview]);

  // Repositionner le dropdown si clavier mobile ou scroll
  useEffect(() => {
    if (!open) return;
    const update = () => setDropStyle(computeDropStyle());
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, computeDropStyle]);

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  };

  const openDropdown = (tracks) => {
    setResults(tracks);
    setNoResults(tracks.length === 0);
    if (!tracks.length) { setOpen(false); return; }
    setDropStyle(computeDropStyle());
    setOpen(true);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); setNoResults(false); return; }
    setNoResults(false);
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/music/search?q=${encodeURIComponent(val)}&limit=10`);
        const data = await res.json();
        openDropdown(data.tracks || []);
      } catch {
        setNoResults(true);
      }
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
      <style>{`
        .add-manual-short { display: none; }
        @media (max-width: 768px) {
          .add-manual-long  { display: none; }
          .add-manual-short { display: inline; }
          .song-dd .song-dur   { display: none; }
          .song-dd .song-row   { gap: 8px !important; padding: 9px 12px !important; }
          .song-dd .song-inner { gap: 8px !important; }
          .song-dd .song-add   { padding: 4px 8px !important; }
        }
      `}</style>
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Rechercher un titre ou un artiste…"
          style={{
            flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, fontFamily: 'inherit',
          }}
        />
        {query.trim() && (
          <button
            onClick={addManual}
            disabled={adding === 'manual'}
            title="Ajouter ce texte tel quel (titre non trouvé)"
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <span className="add-manual-long">+ Ajouter manuellement</span>
            <span className="add-manual-short">+ Manuel</span>
          </button>
        )}
      </div>

      {/* Message aucun résultat */}
      {noResults && !loading && query.trim().length >= 2 && !open && (
        <p style={{
          margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic',
        }}>
          Aucun résultat sur Deezer — utilisez &laquo;&nbsp;Ajouter manuellement&nbsp;&raquo; si vous connaissez le titre et l&apos;artiste.
        </p>
      )}

      {open && results.length > 0 && typeof document !== 'undefined' && createPortal(
        <div ref={dropRef} className="song-dd" style={{
          ...dropStyle,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, overflow: 'hidden', maxHeight: '60vh', overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
        }}>
          {results.map(track => (
            <div
              key={track.id}
              className="song-row"
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
                className="song-inner"
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
                {track.duration ? <span className="song-dur" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, flexShrink: 0 }}>{fmtDuration(track.duration)}</span> : null}
                {adding === track.id
                  ? <Loader2 size={14} color="#b8ef0b" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  : <span className="song-add" style={{
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
        </div>,
        document.body
      )}
    </div>
  );
}

function SuggestionsTab({ playlistId, token, onRefresh, onApproved }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState(null);
  const [playingId, setPlayingId]     = useState(null);

  const stopPreview = useCallback(() => {
    if (_globalAudio && _globalStop === setPlayingId) stopGlobalAudio();
    setPlayingId(null);
  }, []);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const togglePreview = (s) => {
    if (!s.preview_url) return;
    if (playingId === s.id) { stopGlobalAudio(); setPlayingId(null); return; }
    stopGlobalAudio();
    const audio = new Audio(s.preview_url);
    audio.onended = () => { _globalAudio = null; _globalStop = null; setPlayingId(null); };
    audio.play().catch(() => setPlayingId(null));
    registerGlobalAudio(audio, setPlayingId);
    setPlayingId(s.id);
  };

  const load = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/suggestions/${playlistId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setLoading(false);
  }, [playlistId, token]);

  useEffect(() => { load(); }, [load]);

  const act = async (suggestionId, action) => {
    setActing(suggestionId + action);
    await fetch(`/api/mon-espace/suggestions/approve/${suggestionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    await load();
    await onRefresh();
    if (action === 'approve') onApproved?.();
    setActing(null);
  };

  const approveAll = async () => {
    setActing('all');
    await fetch(`/api/mon-espace/suggestions/${playlistId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'approve-all' }),
    });
    await load();
    await onRefresh();
    onApproved?.();
    setActing(null);
  };

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: '12px 0' }}>Chargement…</p>;

  const pending  = suggestions.filter(s => s.status === 'pending');
  const approved = suggestions.filter(s => s.status === 'approved');
  const rejected = suggestions.filter(s => s.status === 'rejected');

  if (suggestions.length === 0) {
    return <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', margin: '12px 0' }}>Aucune proposition pour cette playlist.</p>;
  }

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              À valider ({pending.length})
            </span>
            <button onClick={approveAll} disabled={acting === 'all'} style={{
              background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
              color: '#b8ef0b', fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-display), sans-serif',
            }}>
              <Check size={11} style={{ marginRight: 4, display: 'inline' }} />
              Tout valider
            </button>
          </div>
          {pending.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {/* Bouton preview */}
              <button
                onClick={() => togglePreview(s)}
                disabled={!s.preview_url}
                title={s.preview_url ? 'Écouter un extrait (30s)' : 'Extrait indisponible'}
                style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none',
                  cursor: s.preview_url ? 'pointer' : 'not-allowed',
                  background: playingId === s.id ? '#b8ef0b' : 'rgba(184,239,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {playingId === s.id
                  ? <Pause size={11} color="#060e16" fill="#060e16" />
                  : <Play size={11} color="#b8ef0b" fill="#b8ef0b" style={{ marginLeft: 1 }} />
                }
              </button>

              {s.cover_url && <img src={s.cover_url} alt="" width={30} height={30} style={{ borderRadius: 6, flexShrink: 0, objectFit: 'cover' }} />}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {s.artist}{s.event_guests?.first_name ? ` · par ${s.event_guests.first_name}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { stopPreview(); act(s.id, 'approve'); }} disabled={!!acting} style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#22c55e',
                }}>
                  {acting === s.id + 'approve' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ThumbsUp size={12} />}
                </button>
                <button onClick={() => { stopPreview(); act(s.id, 'reject'); }} disabled={!!acting} style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#ef4444',
                }}>
                  {acting === s.id + 'reject' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ThumbsDown size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {approved.length > 0 && (
        <p style={{ fontSize: 11, color: '#22c55e', margin: '6px 0 0' }}>{approved.length} chanson{approved.length > 1 ? 's' : ''} validée{approved.length > 1 ? 's' : ''}</p>
      )}
      {rejected.length > 0 && (
        <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.5)', margin: '4px 0 0' }}>{rejected.length} refusée{rejected.length > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

function PlaylistCard({ playlist, token, onRefresh, isCollaborator }) {
  const [open,      setOpen]      = useState(false);
  const [activeTab, setActiveTab] = useState('playlist');
  const [renaming,  setRenaming]  = useState(false);
  const [newName,   setNewName]   = useState(playlist.name);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [savingVis, setSavingVis] = useState(false);
  const nameInputRef = useRef(null);

  // Interrupteur de visibilité selon le rôle :
  // - accès partagé (témoin) : cacher aux mariés (is_surprise)
  // - mariés (propriétaire)   : cacher aux accès partagés (hidden_from_collaborators)
  const hidden = isCollaborator ? !!playlist.is_surprise : !!playlist.hidden_from_collaborators;
  const toggleVisibility = async () => {
    if (savingVis) return;
    setSavingVis(true);
    const body = isCollaborator
      ? { is_surprise: !playlist.is_surprise }
      : { hidden_from_collaborators: !playlist.hidden_from_collaborators };
    await fetch(`/api/mon-espace/playlists/${playlist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setSavingVis(false);
    onRefresh();
  };

  const deleteTrack = useCallback(async (trackId) => {
    await fetch(`/api/mon-espace/playlists/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    onRefresh();
  }, [token, onRefresh]);

  const startRename = (e) => {
    e.stopPropagation();
    setNewName(playlist.name);
    setRenaming(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setRenaming(false);
    setNewName(playlist.name);
  };

  const saveRename = async (e) => {
    e?.stopPropagation();
    if (!newName.trim() || newName.trim() === playlist.name) { cancelRename(); return; }
    setSaving(true);
    await fetch(`/api/mon-espace/playlists/${playlist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setSaving(false);
    setRenaming(false);
    onRefresh();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Supprimer la playlist "${playlist.name}" et tous ses titres ?`)) return;
    setDeleting(true);
    await fetch(`/api/mon-espace/playlists/${playlist.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setDeleting(false);
    onRefresh();
  };

  // Ordre local des titres (mise à jour optimiste au clic sur ↑/↓).
  // Resynchronisé quand la prop change (ajout/suppression/refresh) via le
  // pattern React « ajuster l'état pendant le rendu » (comparaison d'état,
  // pas de ref pendant le rendu).
  const [tracks, setTracks] = useState(playlist.playlist_tracks || []);
  const [prevTracksProp, setPrevTracksProp] = useState(playlist.playlist_tracks);
  if (playlist.playlist_tracks !== prevTracksProp) {
    setPrevTracksProp(playlist.playlist_tracks);
    setTracks(playlist.playlist_tracks || []);
  }

  // Miroir dans une ref (mise à jour hors rendu) pour lire l'ordre courant
  // dans moveTrack sans dépendre d'une closure obsolète.
  const tracksRef = useRef(tracks);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  const moveTrack = useCallback((trackId, dir) => {
    const prev = tracksRef.current;
    const idx  = prev.findIndex(t => t.id === trackId);
    if (idx < 0) return;
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= prev.length) return;

    const next = [...prev];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    tracksRef.current = next;
    setTracks(next);   // déplacement instantané à l'écran

    fetch('/api/mon-espace/playlists/tracks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ playlist_id: playlist.id, orderedIds: next.map(t => t.id) }),
    }).catch(() => {});
  }, [token, playlist.id]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, marginBottom: 10, position: 'relative',
      zIndex: open ? 10 : 1,
    }}>
      <style>{`
        @media (max-width: 640px) {
          .pl-card-header { padding: 10px 12px !important; gap: 8px !important; }
          .pl-card-btn { flex-wrap: wrap; gap: 6px !important; }
          .pl-card-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: calc(100vw - 140px); }
          .pl-card-actions { gap: 2px !important; }
        }
      `}</style>
      <div className="pl-card-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', gap: 12,
        }}
      >
        {/* Zone cliquable pour ouvrir/fermer */}
        <button className="pl-card-btn"
          onClick={() => !renaming && setOpen(o => !o)}
          style={{
            flex: 1, background: 'none', border: 'none',
            cursor: renaming ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left',
          }}
        >
          {(playlist.is_surprise || playlist.hidden_from_collaborators)
            ? <Gift size={16} color="#a78bfa" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            : <Music2 size={16} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          }

          {renaming ? (
            <input
              ref={nameInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRename(e); if (e.key === 'Escape') cancelRename(e); }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,239,11,0.4)',
                borderRadius: 6, padding: '3px 10px', color: '#fff', fontSize: 14,
                fontFamily: 'inherit', outline: 'none', minWidth: 0, flex: 1,
              }}
            />
          ) : (
            <span className="pl-card-name" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>
              {playlist.name}
            </span>
          )}
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '2px 8px',
            flexShrink: 0,
          }}>{tracks.length} titre{tracks.length !== 1 ? 's' : ''}</span>
          {(playlist.is_surprise || playlist.hidden_from_collaborators) && (
            <span style={{
              background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              flexShrink: 0, fontFamily: 'var(--font-display), sans-serif',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Gift size={9} /> {playlist.is_surprise ? 'Surprise' : 'Privée'}
            </span>
          )}
          {playlist.pending_suggestions > 0 && (
            <span style={{
              background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              flexShrink: 0, fontFamily: 'var(--font-display), sans-serif',
            }}>
              {playlist.pending_suggestions} à valider
            </span>
          )}
        </button>

        {/* Actions : renommer, supprimer, chevron */}
        <div className="pl-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {renaming ? (
            <>
              <button onClick={saveRename} disabled={saving} title="Enregistrer" style={{
                background: 'rgba(184,239,11,0.12)', border: '1px solid rgba(184,239,11,0.3)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#b8ef0b',
              }}>
                {saving ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={12} />}
              </button>
              <button onClick={cancelRename} title="Annuler" style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              }}>
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button onClick={startRename} title="Renommer la playlist" style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
                color: 'rgba(255,255,255,0.25)', borderRadius: 5, transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#b8ef0b'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                <Pencil size={13} />
              </button>
              <button onClick={handleDelete} disabled={deleting} title="Supprimer la playlist" style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
                color: 'rgba(255,255,255,0.25)', borderRadius: 5, transition: 'color 0.15s',
                opacity: deleting ? 0.5 : 1,
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                <Trash2 size={13} />
              </button>
              <button onClick={() => setOpen(o => !o)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              }}>
                {open
                  ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" />
                  : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />
                }
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 18px 18px' }}>

          {/* Visibilité de la playlist (rôle-dépendante) */}
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={toggleVisibility}
              disabled={savingVis}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: hidden ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${hidden ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 7, padding: '6px 12px', cursor: savingVis ? 'default' : 'pointer',
                color: hidden ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {savingVis
                ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <Gift size={13} />}
              <span style={{ fontWeight: hidden ? 700 : 400 }}>
                {isCollaborator
                  ? (hidden ? 'Surprise activée — cachée aux mariés' : 'Cacher aux mariés (surprise)')
                  : (hidden ? 'Cachée aux accès partagés' : 'Cacher aux accès partagés')}
              </span>
            </button>
            {hidden && (
              <div style={{
                marginTop: 8, fontSize: 12, color: 'rgba(167,139,250,0.75)',
                background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 6, padding: '8px 12px', lineHeight: 1.6,
              }}>
                {isCollaborator
                  ? <><strong style={{ color: '#a78bfa' }}>Invisible pour les mariés.</strong> Seuls les accès partagés (témoins) et Myracoustic la voient — parfait pour préparer une surprise.</>
                  : <><strong style={{ color: '#a78bfa' }}>Invisible pour les accès partagés.</strong> Seuls vous (les mariés) et Myracoustic la voyez.</>}
              </div>
            )}
          </div>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
            {['playlist', 'propositions'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 14px', fontSize: 12, fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? '#b8ef0b' : 'rgba(255,255,255,0.3)',
                borderBottom: activeTab === tab ? '2px solid #b8ef0b' : '2px solid transparent',
                fontFamily: 'var(--font-display), sans-serif',
                textTransform: 'capitalize',
              }}>
                {tab === 'playlist' ? 'Playlist' : 'Propositions invités'}
              </button>
            ))}
          </div>

          {activeTab === 'playlist' && (
            <>
              {tracks.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: '0 0 12px', fontStyle: 'italic' }}>
                  Aucun titre pour l'instant — utilisez la recherche ci-dessous.
                </p>
              )}
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  token={token}
                  onDelete={deleteTrack}
                  onMove={moveTrack}
                  index={i}
                  total={tracks.length}
                />
              ))}
              <SearchBar playlistId={playlist.id} token={token} onAdded={onRefresh} />
            </>
          )}

          {activeTab === 'propositions' && (
            <SuggestionsTab
              playlistId={playlist.id}
              token={token}
              onRefresh={onRefresh}
              onApproved={() => setActiveTab('playlist')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CreatePlaylistForm({ eventId, token, onCreated, isCollaborator, lockSurprise = false }) {
  const [open,      setOpen]      = useState(false);
  const [name,      setName]      = useState('');
  const [isSurprise, setIsSurprise] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/mon-espace/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId, name: name.trim(), is_surprise: isSurprise }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.playlist) { setName(''); setIsSurprise(false); setOpen(false); onCreated(); }
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
        background: 'none', border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)', fontSize: 12,
        fontFamily: 'var(--font-display), sans-serif',
      }}
    >
      <Plus size={13} /> Créer une playlist personnalisée
    </button>
  );

  return (
    <div style={{
      marginTop: 10, background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isSurprise ? 'rgba(139,92,246,0.35)' : 'rgba(184,239,11,0.25)'}`,
      borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
          autoFocus placeholder="Nom de la playlist (ex : Groupe de danse, Entrée des mariés…)"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 13, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={save} disabled={saving || !name.trim()}
          style={{
            background: isSurprise ? '#a78bfa' : '#b8ef0b',
            color: '#060e16', border: 'none', borderRadius: 6,
            padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            fontFamily: 'var(--font-display), sans-serif', flexShrink: 0,
            opacity: !name.trim() ? 0.4 : 1,
          }}
        >Créer</button>
        <button onClick={() => { setOpen(false); setIsSurprise(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
          <X size={14} />
        </button>
      </div>

      {/* Toggle surprise — collaborateurs, réservé Prestige */}
      {isCollaborator && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setIsSurprise(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: isSurprise ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSurprise ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
              color: isSurprise ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <Gift size={13} />
            <span style={{ fontWeight: isSurprise ? 700 : 400 }}>
              {isSurprise ? 'Playlist surprise activée' : 'Rendre cette playlist secrète (surprise)'}
            </span>
          </button>
          {isSurprise && (
            <div style={{
              marginTop: 8, fontSize: 12, color: 'rgba(167,139,250,0.7)',
              background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 6, padding: '8px 12px', lineHeight: 1.6,
            }}>
              <Gift size={12} color="#a78bfa" style={{ verticalAlign: '-1px' }} /> <strong style={{ color: '#a78bfa' }}>Mode surprise activé</strong> — Cette playlist sera
              <strong> invisible pour les mariés</strong>. Seuls vous et Myracoustic pourrez la voir et la télécharger.
              Parfait pour préparer une animation ou une entrée musicale en toute discrétion !
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlaylistSection({ eventId, token, onSuggestionActed, isCollaborator, lockSurprise = false }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]     = useState(true);
  const onActedRef = useRef(onSuggestionActed);
  useEffect(() => { onActedRef.current = onSuggestionActed; }, [onSuggestionActed]);

  const refresh = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/playlists/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setPlaylists(data.playlists || []);
    onActedRef.current?.();
  }, [eventId, token]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  if (loading) return <SkeletonPlaylist count={3} />;

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
          Ajoutez vos titres dans chaque playlist. Vous pouvez aussi créer des playlists personnalisées et les associer à votre programme.
        </p>
        {playlists.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', marginBottom: 12 }}>
            Aucune playlist pour l'instant.
          </p>
        )}
        {playlists.map(pl => (
          <PlaylistCard key={pl.id} playlist={pl} token={token} onRefresh={refresh} isCollaborator={isCollaborator} />
        ))}
        <CreatePlaylistForm eventId={eventId} token={token} onCreated={refresh} isCollaborator={isCollaborator} lockSurprise={lockSurprise} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
