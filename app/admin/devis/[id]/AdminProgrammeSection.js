'use client';
import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Eye, EyeOff, Loader } from 'lucide-react';

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
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/programme`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  if (items.length === 0 && !open) return null;

  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '20px 24px',
      border: '1px solid rgba(139,92,246,0.2)', marginTop: 20,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color="#a78bfa" />
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
            color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>Animations secrètes — Programme</h2>
          <span style={{
            fontSize: 10, background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
            border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700,
          }}>{items.filter(i => i.secret_animation).length} configurée{items.filter(i => i.secret_animation).length > 1 ? 's' : ''}</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
          }}>
            <strong style={{ color: '#a78bfa' }}>Animations secrètes</strong> — Pour chaque étape du programme client,
            vous pouvez ajouter une animation surprise préparée en amont.
            Le client ne verra cette information que si vous activez <em>"Visible par le client"</em>.
            Utile pour coordonner une entrée musicale surprise, un feu d'artifice, une intervention sans spoiler.
          </div>

          {items.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' }}>
              Le client n'a pas encore créé son programme.
            </p>
          )}

          {items.map(item => (
            <div key={item.id} style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 14, marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-mono), monospace', fontSize: 13, fontWeight: 700,
                  color: '#b8ef0b', width: 52, flexShrink: 0,
                }}>{item.time}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1 }}>{item.label}</span>
                {item.secret_visible && item.secret_animation && (
                  <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>✨ Révélé</span>
                )}
              </div>
              {item.instructions && (
                <div style={{ marginLeft: 64, marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                  Instructions client : {item.instructions}
                </div>
              )}
              <SecretRow item={item} eventId={eventId} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
