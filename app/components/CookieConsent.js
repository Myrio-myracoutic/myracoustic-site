'use client';

import { useEffect, useRef, useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [refuserHover, setRefuserHover] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    setVisible(getConsent() === null);
    const reopen = () => setVisible(true);
    window.addEventListener('myra-cookie-prefs', reopen);
    return () => window.removeEventListener('myra-cookie-prefs', reopen);
  }, []);

  // Le bandeau est position:fixed en bas d'écran — sans cette marge, il peut recouvrir
  // le pied de page sur une page courte.
  useEffect(() => {
    if (!visible || !barRef.current) {
      document.body.style.paddingBottom = '';
      return;
    }
    const el = barRef.current;
    const applyPadding = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
    };
    applyPadding();
    const observer = new ResizeObserver(applyPadding);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [visible]);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: '1px solid #dfe3e8',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
        padding: '16px 24px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: '1 1 360px' }}>
          <p style={{ fontSize: 13, color: '#1a2a3a', lineHeight: 1.6, margin: 0 }}>
            Avec votre accord, Myracoustic utilise des cookies de mesure d'audience et de suivi publicitaire
            (Google Ads).{' '}
            <a href="/politique-confidentialite" style={{ color: '#1a2a3a', textDecoration: 'underline', fontWeight: 600 }}>
              En savoir plus →
            </a>
          </p>
          <p className="hide-mobile" style={{ fontSize: 13, color: '#415266', lineHeight: 1.6, margin: '8px 0 0' }}>
            En cas de refus, seuls les cookies techniques nécessaires au fonctionnement du site seront déposés.
            Vous pourrez modifier votre choix à tout moment via le lien « Préférences cookies » en bas de page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => choose('denied')}
            onMouseEnter={() => setRefuserHover(true)}
            onMouseLeave={() => setRefuserHover(false)}
            className="btn-secondary"
            style={{
              color: '#1a2a3a',
              borderColor: refuserHover ? '#8a94a0' : '#c7cdd4',
              background: refuserHover ? '#f2f4f6' : 'transparent',
            }}
          >
            Refuser
          </button>
          <button
            onClick={() => choose('granted')}
            className="btn-primary"
            style={{ background: 'var(--bg)', color: '#ffffff' }}
          >
            Accepter &amp; Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
