'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { use } from 'react';
import Image from 'next/image';
import { Music2, Search, Plus, Check, X, Loader2, Play, Pause, CheckCircle2 } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function RSVPCard({ guest, token, onUpdated }) {
  const [attending, setAttending]     = useState(guest.attending);
  const [adults,    setAdults]        = useState(guest.adults_count || 1);
  const [children,  setChildren]      = useState(guest.children_count || 0);
  const [saving,    setSaving]        = useState(false);
  const [saved,     setSaved]         = useState(false);

  const save = async (att, a, c) => {
    setSaving(true);
    await fetch(`/api/invitation/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attending: att, adultsCount: a, childrenCount: c }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onUpdated({ attending: att, adults_count: a, children_count: c });
  };

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '24px 24px', marginBottom: 20,
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px',
      }}>Votre présence</h3>

      <div style={{ display: 'flex', gap: 10, marginBottom: attending ? 16 : 0 }}>
        {[true, false].map(val => (
          <button key={String(val)} onClick={() => { setAttending(val); if (!val) save(val, 0, 0); }} style={{
            flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: attending === val
              ? (val ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)')
              : 'rgba(255,255,255,0.04)',
            color: attending === val
              ? (val ? '#22c55e' : '#ef4444')
              : 'rgba(255,255,255,0.4)',
            outline: attending === val
              ? `1px solid ${val ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`
              : '1px solid rgba(255,255,255,0.06)',
            fontWeight: attending === val ? 700 : 400, fontSize: 14,
            fontFamily: 'var(--font-display), sans-serif',
          }}>
            {val ? '✓ Je serai présent(e)' : '✗ Je ne pourrai pas venir'}
          </button>
        ))}
      </div>

      {attending === true && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1 }}>Nombre d'adultes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setAdults(a => Math.max(1, a - 1))} style={counterBtn}> - </button>
              <span style={{ width: 24, textAlign: 'center', color: '#fff', fontWeight: 700 }}>{adults}</span>
              <button onClick={() => setAdults(a => a + 1)} style={counterBtn}> + </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1 }}>Nombre d'enfants</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setChildren(c => Math.max(0, c - 1))} style={counterBtn}> - </button>
              <span style={{ width: 24, textAlign: 'center', color: '#fff', fontWeight: 700 }}>{children}</span>
              <button onClick={() => setChildren(c => c + 1)} style={counterBtn}> + </button>
            </div>
          </div>
          <button onClick={() => save(true, adults, children)} disabled={saving} style={{
            alignSelf: 'flex-start', background: '#b8ef0b', color: '#060e16', border: 'none',
            borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 800,
            fontSize: 13, fontFamily: 'var(--font-display), sans-serif', marginTop: 4,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {saved ? <><CheckCircle2 size={14} /> Enregistré</> : saving ? 'Enregistrement…' : 'Confirmer ma présence'}
          </button>
        </div>
      )}
    </div>
  );
}

const counterBtn = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function SongSearch({ playlistId, token, onAdded }) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [adding,    setAdding]    = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [dropStyle, setDropStyle] = useState({});
  const searchTimer = useRef(null);
  const wrapRef     = useRef(null);
  const inputRef    = useRef(null);
  const audioRef    = useRef(null);

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
    if (!open) return;
    const update = () => setDropStyle(computeDropStyle());
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, computeDropStyle]);

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
        const res   = await fetch(`/api/music/search?q=${encodeURIComponent(val)}&limit=6`);
        const data  = await res.json();
        const tracks = data.tracks || [];
        setResults(tracks);
        if (tracks.length) { setDropStyle(computeDropStyle()); setOpen(true); }
        else setOpen(false);
      } catch {}
      setLoading(false);
    }, 400);
  };

  const propose = async (track) => {
    stopPreview();
    setAdding(track.id);
    const res = await fetch(`/api/invitation/${token}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playlistId: playlistId,
        deezerId:   String(track.id),
        title:      track.title,
        artist:     track.artist,
        album:      track.album,
        coverUrl:   track.cover,
        previewUrl: track.preview,
      }),
    });
    const data = await res.json();
    setAdding(null);
    if (res.status === 409) { alert('Vous avez déjà proposé cette chanson.'); return; }
    if (res.status === 429) { alert(data.error); return; }
    setQuery(''); setResults([]); setOpen(false);
    onAdded();
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', marginTop: 14 }}>
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
          type="text" value={query} onChange={handleChange}
          onFocus={() => setTimeout(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)}
          placeholder="Rechercher un titre ou un artiste…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          ...dropStyle,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          maxHeight: '60vh', overflowY: 'auto',
        }}>
          {results.map(track => (
            <div key={track.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <button onClick={() => togglePreview(track)} disabled={!track.preview} style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none',
                cursor: track.preview ? 'pointer' : 'not-allowed',
                background: playingId === track.id ? '#b8ef0b' : 'rgba(184,239,11,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {playingId === track.id
                  ? <Pause size={13} color="#060e16" fill="#060e16" />
                  : <Play size={13} color="#b8ef0b" fill="#b8ef0b" style={{ marginLeft: 1 }} />
                }
              </button>
              <button onClick={() => propose(track)} disabled={adding === track.id} style={{
                flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: 0,
              }}>
                {track.cover && <img src={track.cover} alt="" width={30} height={30} style={{ borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}{track.album ? ` · ${track.album}` : ''}</div>
                </div>
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

function PlaylistBlock({ playlist, token, maxSongs, onRefresh }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg] = useState(true);

  const loadSuggestions = useCallback(async () => {
    const res  = await fetch(`/api/invitation/${token}/suggestions`);
    const data = await res.json();
    const mine = (data.suggestions || []).filter(s => s.playlist_id === playlist.id);
    setSuggestions(mine);
    setLoadingSugg(false);
  }, [token, playlist.id]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '20px 20px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Music2 size={16} color="#b8ef0b" strokeWidth={1.5} />
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 700,
          color: '#fff', margin: 0,
        }}>{playlist.name}</h3>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>
        {suggestions.length}/{maxSongs} proposition{suggestions.length !== 1 ? 's' : ''} effectuée{suggestions.length !== 1 ? 's' : ''}
      </p>

      {/* Mes propositions */}
      {!loadingSugg && suggestions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {s.cover_url && <img src={s.cover_url} alt="" width={28} height={28} style={{ borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.artist}</div>
              </div>
              <Check size={13} color="#b8ef0b" style={{ flexShrink: 0 }} />
              <button
                onClick={async () => {
                  await fetch(`/api/invitation/${token}/suggest`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suggestionId: s.id }),
                  });
                  loadSuggestions();
                }}
                title="Retirer cette proposition"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
                  color: 'rgba(255,255,255,0.2)', lineHeight: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestions.length < maxSongs && (
        <SongSearch playlistId={playlist.id} token={token} onAdded={() => loadSuggestions()} />
      )}
      {suggestions.length >= maxSongs && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0 }}>
          Vous avez atteint la limite de {maxSongs} proposition{maxSongs > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
}

export default function InvitationPage({ params }) {
  const { token } = use(params);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/invitation/${token}`);
    if (!res.ok) { setError("Lien d'invitation invalide ou expiré."); setLoading(false); return; }
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#b8ef0b" style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ color: '#ef4444', fontSize: 16, marginBottom: 8 }}>{error}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Ce lien n'est plus valide. Contactez votre hôte pour recevoir une nouvelle invitation.</p>
      </div>
    </div>
  );

  const { guest, event, eventTitle, playlists, page } = data;

  // Titre affiché : faire-part title > event_type + date
  const displayTitle = eventTitle || (event
    ? `${event.event_type}${event.event_date ? ` · ${fmtDate(event.event_date)}` : ''}`
    : 'Votre invitation');

  return (
    <div style={{ minHeight: '100vh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header minimaliste */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Image src="/logo.png" alt="Myracoustic" width={100} height={34} style={{ height: 34, width: 'auto' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-display), sans-serif' }}>
          Invitation personnelle
        </span>
      </div>

      {/* Titre de l'événement */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '28px 20px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 800,
          color: '#fff', margin: '0 0 6px', lineHeight: 1.2,
        }}>{displayTitle}</h1>
        {event?.event_date && eventTitle && (
          <p style={{ fontSize: 13, color: '#b8ef0b', margin: 0, fontWeight: 600 }}>
            {fmtDate(event.event_date)}
            {event.venue_city && ` · ${event.venue_city}`}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: eventTitle ? '8px 0 0' : '6px 0 0' }}>
          Bonjour {guest.first_name}, cette invitation vous est réservée.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Faire-part si publié (message + sous-titre) */}
        {page && (page.subtitle || page.message) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(184,239,11,0.06), rgba(184,239,11,0.02))',
            border: '1px solid rgba(184,239,11,0.15)', borderRadius: 16, padding: '24px', marginBottom: 24,
          }}>
            {page.subtitle && <p style={{ fontSize: 13, color: '#b8ef0b', margin: '0 0 12px', fontWeight: 600 }}>{page.subtitle}</p>}
            {page.message && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>{page.message}</p>}
          </div>
        )}

        {/* RSVP */}
        <RSVPCard guest={guest} token={token} onUpdated={(upd) => setData(d => ({ ...d, guest: { ...d.guest, ...upd } }))} />

        {/* Propositions de chansons */}
        {playlists.length > 0 && (
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 800,
              color: '#fff', margin: '0 0 6px',
            }}>Proposez vos chansons</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
              Recherchez vos titres favoris et ajoutez-les dans les playlists ci-dessous. Les propositions sont soumises à validation.
            </p>
            {playlists.map(pl => (
              <PlaylistBlock key={pl.id} playlist={pl} token={token} maxSongs={guest.max_songs} onRefresh={load} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
