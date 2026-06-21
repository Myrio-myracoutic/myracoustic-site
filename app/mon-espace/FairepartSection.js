'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Eye, EyeOff, Save } from 'lucide-react';

export default function FairepartSection({ ev, token }) {
  const [page,    setPage]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const [title,       setTitle]       = useState('');
  const [subtitle,    setSubtitle]    = useState('');
  const [message,     setMessage]     = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('event_page')
      .select('*')
      .eq('event_id', ev.id)
      .maybeSingle();

    if (data) {
      setPage(data);
      setTitle(data.title || '');
      setSubtitle(data.subtitle || '');
      setMessage(data.message || '');
      setIsPublished(data.is_published || false);
    }
    setLoading(false);
  }, [ev.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const payload = { event_id: ev.id, title, subtitle, message, is_published: isPublished };
    await supabase.from('event_page').upsert(payload, { onConflict: 'event_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</div>;

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Page de faire-part</h3>

        <button
          onClick={() => setIsPublished(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            color: isPublished ? '#22c55e' : 'rgba(255,255,255,0.4)',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display), sans-serif',
          }}
        >
          {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
          {isPublished ? 'Visible par les invités' : 'Masqué aux invités'}
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
        Cette page s'affiche en haut de la page d'invitation de chaque invité lorsqu'elle est publiée.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontWeight: 600 }}>
            TITRE DE L'ÉVÉNEMENT
          </label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder={`Ex : Mariage de Marie & Paul`}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15,
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontWeight: 600 }}>
            SOUS-TITRE (date, lieu…)
          </label>
          <input
            value={subtitle} onChange={e => setSubtitle(e.target.value)}
            placeholder="Ex : Samedi 27 juin 2026 · Château de la Bretesche"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 14,
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontWeight: 600 }}>
            MESSAGE POUR LES INVITÉS
          </label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Ex : Nous sommes heureux de vous convier à notre mariage ! Pour rendre ce jour encore plus magique, proposez vos chansons favorites pour la playlist..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />
        </div>
      </div>

      {/* Aperçu */}
      {(title || subtitle || message) && (
        <div style={{
          marginTop: 20, background: '#060e16', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '20px 24px',
        }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 12px', textTransform: 'uppercase' }}>
            Aperçu
          </p>
          {title && <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{title}</h2>}
          {subtitle && <p style={{ fontSize: 13, color: '#b8ef0b', margin: '0 0 14px', fontWeight: 600 }}>{subtitle}</p>}
          {message && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{message}</p>}
        </div>
      )}

      <button
        onClick={save} disabled={saving}
        style={{
          marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 10,
          padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: 14,
          fontFamily: 'var(--font-display), sans-serif', opacity: saving ? 0.7 : 1,
        }}
      >
        <Save size={15} />
        {saved ? '✓ Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
