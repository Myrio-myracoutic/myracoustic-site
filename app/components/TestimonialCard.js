'use client';

import { useState } from 'react';

export default function TestimonialCard({ name, event, stars, text }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--card2)', padding: 28, borderRadius: 12,
        border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.25s', transform: hov ? 'translateY(-5px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} style={{ color: 'var(--lime)', fontSize: 17 }}>★</span>
        ))}
      </div>
      <p style={{
        color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, fontSize: 15,
        marginBottom: 20, fontStyle: 'italic',
      }}>
        "{text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,var(--indigo),var(--lime))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 15, color: '#0d1b2a',
        }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14 }}>
            {name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 }}>
            {event}
          </div>
        </div>
      </div>
    </div>
  );
}
