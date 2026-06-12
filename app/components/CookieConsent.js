'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--card)',
        borderTop: '1px solid var(--separator)',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, flex: '1 1 320px', margin: 0 }}>
        Nous utilisons des cookies pour mesurer l'audience du site et améliorer votre expérience.
        Vous pouvez accepter ou refuser ce suivi.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => choose('denied')} className="btn-secondary">
          Refuser
        </button>
        <button onClick={() => choose('granted')} className="btn-primary">
          Accepter
        </button>
      </div>
    </div>
  );
}
