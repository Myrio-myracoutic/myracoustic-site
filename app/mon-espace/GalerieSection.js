'use client';
import { useEffect, useState, useCallback } from 'react';
import { Camera } from 'lucide-react';
import GalleryGrid from '@/app/components/GalleryGrid';

export default function GalerieSection({ ev, token }) {
  const [photos,    setPhotos]    = useState([]);
  const [published, setPublished] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const isTermine = ev.status === 'termine';

  const load = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/gallery/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPublished(!!data.published);
    setPhotos(data.photos || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</div>;

  // Galerie disponible
  if (published && photos.length > 0) {
    return (
      <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Camera size={16} color="#b8ef0b" strokeWidth={1.6} />
          <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Galerie photos · {photos.length}
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Revivez votre événement. Cliquez sur une photo pour l'ouvrir en grand et la télécharger.
        </p>
        <GalleryGrid photos={photos} />
      </div>
    );
  }

  // Placeholder — pas encore de galerie publiée
  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '40px 28px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Camera size={28} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 700,
        color: 'rgba(255,255,255,0.5)', margin: '0 0 10px',
      }}>Galerie photos</h3>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
        {isTermine
          ? "Vos photos seront bientôt disponibles ici. Nous les partageons avec vous après l'événement."
          : "La galerie photo sera accessible une fois votre événement réalisé."}
      </p>
    </div>
  );
}
