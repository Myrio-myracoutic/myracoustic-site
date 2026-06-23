'use client';
import { useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Save, X, ExternalLink, Music2 } from 'lucide-react';

/* ── Modal aperçu — rendu identique à la page /invitation/[token] ─ */
function PreviewModal({ title, subtitle, message, ev, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '20px 16px', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#060e16', borderRadius: 16, width: '100%', maxWidth: 480,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          overflow: 'hidden', marginBottom: 20,
        }}
      >
        {/* Barre de navigation simulée */}
        <div style={{
          background: 'rgba(6,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Myracoustic" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Invitation personnelle
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* En-tête événement — identique à la page invité */}
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 20px 24px', textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 800,
            color: '#fff', margin: '0 0 6px', lineHeight: 1.2,
          }}>
            {title || ev?.event_type || 'Votre événement'}
          </h1>
          {ev?.event_date && (
            <p style={{ fontSize: 13, color: '#b8ef0b', margin: 0, fontWeight: 600 }}>
              {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {ev.venue_city && ` · ${ev.venue_city}`}
            </p>
          )}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '8px 0 0' }}>
            Bonjour Prénom, cette invitation vous est réservée.
          </p>
        </div>

        {/* Corps — identique à /invitation/[token] */}
        <div style={{ padding: '28px 20px' }}>

          {/* Bloc faire-part — rendu IDENTIQUE à la page invité */}
          {(subtitle || message) ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(184,239,11,0.06), rgba(184,239,11,0.02))',
              border: '1px solid rgba(184,239,11,0.15)',
              borderRadius: 16, padding: '24px', marginBottom: 24,
            }}>
              {subtitle && (
                <p style={{ fontSize: 13, color: '#b8ef0b', margin: '0 0 12px', fontWeight: 600 }}>
                  {subtitle}
                </p>
              )}
              {message && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>
                  {message}
                </p>
              )}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '20px', marginBottom: 24, textAlign: 'center',
              color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic',
            }}>
              Sous-titre et message non renseignés
            </div>
          )}

          {/* RSVP placeholder */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              RSVP
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                ✓ Je serai présent(e)
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                Je ne pourrai pas venir
              </div>
            </div>
          </div>

          {/* Playlists placeholder */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '16px',
            display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.2)',
          }}>
            <Music2 size={16} color="rgba(184,239,11,0.3)" />
            <span style={{ fontSize: 13, fontStyle: 'italic' }}>
              Les playlists pour proposer des chansons apparaissent ici…
            </span>
          </div>
        </div>

        {/* Note en bas */}
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '16px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
            Aperçu de ce que vos invités verront · Le contenu RSVP et les playlists sont simulés
          </p>
        </div>
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
          title={title} subtitle={subtitle} message={message} ev={ev}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
