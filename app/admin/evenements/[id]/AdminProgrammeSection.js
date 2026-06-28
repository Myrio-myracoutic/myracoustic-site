'use client';
import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Eye, EyeOff, Loader, ClipboardList, Music2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { moodLabel, effectLabel } from '@/app/lib/highlights';

function SecretRow({ item, eventId }) {
  const [text,    setText]    = useState(item.secret_animation || '');
  const [visible, setVisible] = useState(!!item.secret_visible);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const timer = { current: null };

  const save = async (newText, newVisible) => {
    setSaving(true);
    await fetch(`/api/admin/programme/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret_animation: newText, secret_visible: newVisible }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTextChange = (val) => {
    setText(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(val, visible), 800);
  };

  const toggleVisible = async () => {
    const next = !visible;
    setVisible(next);
    await save(text, next);
  };

  return (
    <div style={{
      marginLeft: 68, marginTop: 6,
      background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Sparkles size={13} color="#a78bfa" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Animation secrète
        </span>
        <button
          onClick={toggleVisible}
          title={visible ? 'Masquer au client' : 'Révéler au client'}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            background: visible ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${visible ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            color: visible ? '#a78bfa' : 'rgba(255,255,255,0.35)',
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)',
          }}
        >
          {visible ? <Eye size={11} /> : <EyeOff size={11} />}
          {visible ? 'Visible par le client' : 'Masqué au client'}
        </button>
        {saving && <Loader size={11} color="rgba(167,139,250,0.5)" style={{ animation: 'spin 0.8s linear infinite', marginLeft: 4 }} />}
        {saved && !saving && <span style={{ fontSize: 10, color: '#a78bfa', marginLeft: 4 }}>✓</span>}
      </div>
      <textarea
        value={text}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="Décrivez l'animation surprise préparée pour ce moment… (ex : Arrivée musicale surprise, Feu d'artifice, Intervention comique…)"
        rows={2}
        style={{
          width: '100%', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: 6, padding: '8px 12px', color: 'rgba(255,255,255,0.8)', fontSize: 13,
          fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export default function AdminProgrammeSection({ eventId }) {
  const [items,     setItems]     = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/programme`);
    const data = await res.json();
    setItems(data.items || []);
    setPlaylists(data.playlists || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;

  const playlistMap = Object.fromEntries(playlists.map(p => [p.id, p.name]));
  const secretCount = items.filter(i => i.secret_animation).length;
  const highlightCount = items.filter(i => i.is_highlight).length;

  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '20px 24px',
      border: '1px solid rgba(255,255,255,0.07)', marginTop: 20,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={15} color="#b8ef0b" />
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>Programme de l'événement</h2>
          <span style={{
            fontSize: 10, background: 'rgba(184,239,11,0.12)', color: '#b8ef0b',
            border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700,
          }}>{items.length} étape{items.length > 1 ? 's' : ''}</span>
          {highlightCount > 0 && (
            <span style={{
              fontSize: 10, background: 'rgba(184,239,11,0.12)', color: '#b8ef0b',
              border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}><Star size={9} fill="#b8ef0b" /> {highlightCount} moment{highlightCount > 1 ? 's' : ''} fort{highlightCount > 1 ? 's' : ''}</span>
          )}
          {secretCount > 0 && (
            <span style={{
              fontSize: 10, background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}><Sparkles size={9} /> {secretCount} secrète{secretCount > 1 ? 's' : ''}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.3)" />}
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          {items.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
              Le client n'a pas encore créé son programme.
            </p>
          ) : (
            items.map(item => {
              const linkedNames = (item.playlist_ids || []).map(id => playlistMap[id]).filter(Boolean);
              return (
                <div key={item.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 14, marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono), monospace', fontSize: 13, fontWeight: 700,
                      color: '#b8ef0b', width: 52, flexShrink: 0,
                    }}>{item.time}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', flex: 1, fontWeight: 500 }}>{item.label}</span>
                    {item.secret_visible && item.secret_animation && (
                      <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>✨ Révélé</span>
                    )}
                  </div>

                  {/* Notes / instructions saisies par le client */}
                  {item.instructions && (
                    <div style={{ marginLeft: 64, marginTop: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Note : </span>{item.instructions}
                    </div>
                  )}

                  {/* Playlists liées à cette étape */}
                  {linkedNames.length > 0 && (
                    <div style={{ marginLeft: 64, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {linkedNames.map((n, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 10,
                          background: 'rgba(184,239,11,0.08)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.2)',
                        }}><Music2 size={10} /> {n}</span>
                      ))}
                    </div>
                  )}

                  {/* Moment fort : son + lumière souhaités par le couple (lecture seule) */}
                  {item.is_highlight && (
                    <div style={{
                      marginLeft: 64, marginTop: 8,
                      background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.2)',
                      borderRadius: 8, padding: '8px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Star size={12} color="#b8ef0b" fill="#b8ef0b" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b8ef0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Moment fort — son + lumière
                        </span>
                      </div>
                      {item.light_mood && (
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Lumière : </span>{moodLabel(item.light_mood)}
                        </div>
                      )}
                      {(item.effects || []).length > 0 && (
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Effets : </span>{item.effects.map(effectLabel).join(', ')}
                        </div>
                      )}
                      {item.ambiance_note && (
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontStyle: 'italic', marginTop: 2 }}>
                          {item.ambiance_note}
                        </div>
                      )}
                      {!item.light_mood && !(item.effects || []).length && !item.ambiance_note && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                          Marqué comme moment fort (détails non précisés).
                        </div>
                      )}
                    </div>
                  )}

                  {/* Animation secrète (optionnelle) à coordonner côté Myracoustic */}
                  <SecretRow item={item} eventId={eventId} />
                </div>
              );
            })
          )}

          <div style={{
            marginTop: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={12} color="#a78bfa" />
            Les <strong style={{ color: '#a78bfa' }}>animations secrètes</strong> ci-dessus ne sont visibles par le client que si vous activez « Visible par le client ».
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
