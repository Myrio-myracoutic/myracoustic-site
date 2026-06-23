'use client';
import { useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Save, X, ExternalLink } from 'lucide-react';

/* ── Modal aperçu — rendu comme les invités le voient ─────────── */
function PreviewModal({ title, subtitle, message, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#060e16', borderRadius: 16, padding: '36px 32px',
          maxWidth: 560, width: '100%', position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {/* Étiquette */}
        <p style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 24px',
        }}>
          Aperçu — tel que vos invités le verront
        </p>

        {/* Contenu faire-part */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '28px 24px',
        }}>
          {title && (
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800,
              color: '#fff', margin: '0 0 10px', lineHeight: 1.2,
            }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{
              fontSize: 15, color: '#b8ef0b', fontWeight: 600,
              margin: '0 0 20px', lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
          {message && (
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8, margin: 0,
            }}>
              {message}
            </p>
          )}
          {!title && !subtitle && !message && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, margin: 0, fontStyle: 'italic' }}>
              Aucun contenu renseigné pour l'instant.
            </p>
          )}
        </div>

        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '20px 0 0', lineHeight: 1.6,
        }}>
          Ce contenu apparaît en haut de la page d'invitation de chaque invité, avant le formulaire RSVP et les playlists.
        </p>
      </div>
    </div>
  );
}

/* ── Section principale ────────────────────────────────────────── */
export default function FairepartSection({ ev, token }) {
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [title,       setTitle]       = useState('');
  const [subtitle,    setSubtitle]    = useState('');
  const [message,     setMessage]     = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/mon-espace/fairepart/${ev.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.page) {
      setTitle(data.page.title || '');
      setSubtitle(data.page.subtitle || '');
      setMessage(data.page.message || '');
      setIsPublished(data.page.is_published || false);
    }
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/mon-espace/fairepart/${ev.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, subtitle, message, is_published: isPublished }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</div>;

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Page de faire-part</h3>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Aperçu */}
          <button
            onClick={() => setShowPreview(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-display), sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#b8ef0b'; e.currentTarget.style.borderColor = 'rgba(184,239,11,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <ExternalLink size={13} /> Voir l'aperçu
          </button>

          {/* Publier / Masquer */}
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
      </div>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        Cette page s'affiche en haut de la page d'invitation de chaque invité lorsqu'elle est publiée.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontWeight: 600 }}>
            TITRE DE L'ÉVÉNEMENT
          </label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Mariage de Marie & Paul"
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          onClick={save} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 10,
            padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: 14,
            fontFamily: 'var(--font-display), sans-serif', opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={15} />
          {saved ? '✓ Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Modal aperçu */}
      {showPreview && (
        <PreviewModal
          title={title} subtitle={subtitle} message={message}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
