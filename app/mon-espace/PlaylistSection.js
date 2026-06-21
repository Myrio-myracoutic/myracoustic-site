'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Music2, Search, Plus, X, ChevronDown, ChevronUp, Loader2, Play, Pause, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SkeletonPlaylist } from './SkeletonLoader';

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
  const [dropStyle, setDropStyle] = useState({});
  const searchTimer = useRef(null);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
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
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); stopPreview(); }
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
    if (!tracks.length) { setOpen(false); return; }
    setDropStyle(computeDropStyle());
    setOpen(true);
  };

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
        openDropdown(data.tracks || []);
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
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
          ...dropStyle,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, overflow: 'hidden', maxHeight: '60vh', overflowY: 'auto',
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

function SuggestionsTab({ playlistId, token, onRefresh, onApproved }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState(null);

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
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {s.cover_url && <img src={s.cover_url} alt="" width={30} height={30} style={{ borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {s.artist}{s.event_guests?.first_name ? ` · par ${s.event_guests.first_name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => act(s.id, 'approve')} disabled={!!acting} style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#22c55e',
                }}>
                  {acting === s.id + 'approve' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ThumbsUp size={12} />}
                </button>
                <button onClick={() => act(s.id, 'reject')} disabled={!!acting} style={{
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

function PlaylistCard({ playlist, token, onRefresh }) {
  const [open, setOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState('playlist');

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
        </div>
        {open
          ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px' }}>
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
              {tracks.map(track => (
                <TrackRow key={track.id} track={track} token={token} onDelete={deleteTrack} />
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

function CreatePlaylistForm({ eventId, token, onCreated }) {
  const [open,   setOpen]   = useState(false);
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res  = await fetch('/api/mon-espace/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId, name: name.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.playlist) { setName(''); setOpen(false); onCreated(); }
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
      display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,239,11,0.25)',
      borderRadius: 8, padding: '8px 12px',
    }}>
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
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 6,
          padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          fontFamily: 'var(--font-display), sans-serif', flexShrink: 0,
          opacity: !name.trim() ? 0.4 : 1,
        }}
      >Créer</button>
      <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function PlaylistSection({ eventId, token }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]     = useState(true);

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
          <PlaylistCard key={pl.id} playlist={pl} token={token} onRefresh={refresh} />
        ))}
        <CreatePlaylistForm eventId={eventId} token={token} onCreated={refresh} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
