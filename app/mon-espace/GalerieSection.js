'use client';
import { Camera } from 'lucide-react';

export default function GalerieSection({ ev }) {
  const isTermine = ev.status === 'termine';

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
