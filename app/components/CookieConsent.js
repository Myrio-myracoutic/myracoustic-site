'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
      role="region"
      aria-label="Cookies"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: '1px solid #dfe3e8',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
        padding: '8px 16px',
      }}
    >
      {/* Bandeau compact (16/11) : logo en haut à gauche, une question + à quoi servent les
          cookies, « OK pour moi » bien visible, « Refuser » juste à côté en lien simple —
          toujours accessible en un clic, comme l'exige la CNIL. */}
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', columnGap: 20, rowGap: 2 }}>
        <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Logo version fond clair (texte sombre) : le bandeau est blanc. */}
          <Image src="/logo-light.png" alt="Myracoustic" width={750} height={380} style={{ height: 48, width: 'auto', flexShrink: 0, marginLeft: -8 }} />
        <p style={{ flex: 1, fontSize: 13, color: '#1a2a3a', lineHeight: 1.5, margin: 0 }}>
          <strong>Acceptez-vous nos cookies ?</strong> Ils nous aident à comprendre comment le site est utilisé
          pour l'améliorer, et à mesurer l'efficacité de nos publicités (Google, Meta, OpenAI).
          Vous pouvez refuser : le site fonctionne de la même façon.{' '}
          <a href="/politique-confidentialite" style={{ color: '#1a2a3a', textDecoration: 'underline', fontWeight: 600, whiteSpace: 'nowrap' }}>
            En savoir plus
          </a>
        </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => choose('denied')}
            onMouseEnter={() => setRefuserHover(true)}
            onMouseLeave={() => setRefuserHover(false)}
            style={{
              minHeight: 44, padding: '0 14px', border: 'none', borderRadius: 2, cursor: 'pointer',
              font: 'inherit', fontSize: 14, fontWeight: 500, textDecoration: 'underline',
              color: '#1a2a3a', background: refuserHover ? '#f2f4f6' : 'transparent',
              transition: 'background 150ms ease-out',
            }}
          >
            Refuser
          </button>
          <button
            onClick={() => choose('granted')}
            className="btn-primary"
            style={{ minHeight: 44, padding: '0 24px', justifyContent: 'center', whiteSpace: 'nowrap' }}
          >
            OK pour moi
          </button>
        </div>
      </div>
    </div>
  );
}
