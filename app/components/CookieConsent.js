'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const reopen = () => setVisible(true);
    window.addEventListener('myra-cookie-prefs', reopen);
    return () => window.removeEventListener('myra-cookie-prefs', reopen);
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
        padding: '20px 24px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: '1 1 360px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            Avec votre accord, Myracoustic utilise des cookies à des fins de mesure d'audience et de suivi
            de nos campagnes publicitaires (Google Ads).
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: '8px 0 0' }}>
            En cas de refus, seuls les cookies techniques nécessaires au fonctionnement du site seront déposés.
            Vous pourrez modifier votre choix à tout moment via le lien « Préférences cookies » en bas de page.
          </p>
          <a
            href="/politique-confidentialite"
            style={{ fontSize: 12, color: 'var(--lime)', textDecoration: 'underline', display: 'inline-block', marginTop: 8 }}
          >
            En savoir plus →
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => choose('denied')} className="btn-secondary">
            Refuser
          </button>
          <button onClick={() => choose('granted')} className="btn-primary">
            Accepter &amp; Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
