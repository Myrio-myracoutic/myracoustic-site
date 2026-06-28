'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

/* Grille de photos réutilisée côté couple et invité. Clic → lightbox plein écran. */
export default function GalleryGrid({ photos }) {
  const [active, setActive] = useState(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
        {photos.map(p => (
          <button key={p.id} onClick={() => setActive(p.url)} style={{
            padding: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)', cursor: 'pointer', aspectRatio: '1', display: 'block',
          }}>
            <img src={p.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>

      {active && (
        <div onClick={() => setActive(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <button onClick={() => setActive(null)} style={{
            position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
          <img src={active} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <a href={active} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
            position: 'absolute', bottom: 20, background: '#b8ef0b', color: '#060e16',
            borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none',
            fontFamily: 'var(--font-display), sans-serif',
          }}>Ouvrir en plein format / télécharger</a>
        </div>
      )}
    </>
  );
}
