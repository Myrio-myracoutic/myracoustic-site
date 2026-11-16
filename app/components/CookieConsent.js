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

  /* Carte façon « grande enseigne » (16/11, modèle fourni par Myrio) : 768 px de large au
     maximum, centrée sur ordinateur, pleine largeur sur téléphone et tablette. Logo en haut à
     gauche, « Continuer sans accepter » en haut à droite (le refus reste à un clic, comme
     l'exige la CNIL), texte dessous sur toute la largeur, bouton d'accord sur toute la largeur. */
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
        maxWidth: 768,
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #dfe3e8',
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        padding: '8px 16px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Logo version fond clair (texte sombre) : la carte est blanche. */}
        <Image src="/logo-light.png" alt="Myracoustic" width={750} height={380} style={{ height: 48, width: 'auto', flexShrink: 0, marginLeft: -8 }} />
        <button
          onClick={() => choose('denied')}
          onMouseEnter={() => setRefuserHover(true)}
          onMouseLeave={() => setRefuserHover(false)}
          style={{
            minHeight: 44, padding: '0 8px', marginRight: -8, border: 'none', borderRadius: 2, cursor: 'pointer',
            font: 'inherit', fontSize: 14, fontWeight: 500, textDecoration: 'underline',
            color: '#1a2a3a', background: refuserHover ? '#f2f4f6' : 'transparent',
            transition: 'background 150ms ease-out',
          }}
        >
          Continuer sans accepter
        </button>
      </div>
      <p style={{ fontSize: 13.5, color: '#1a2a3a', lineHeight: 1.55, margin: '2px 0 12px' }}>
        <strong>Acceptez-vous nos cookies ?</strong> Ils nous aident à comprendre comment le site est utilisé
        pour l'améliorer, et à mesurer l'efficacité de nos publicités (Google, Meta, OpenAI).
        Vous pouvez refuser : le site fonctionne de la même façon.{' '}
        <a href="/politique-confidentialite" style={{ color: '#1a2a3a', textDecoration: 'underline', fontWeight: 600, whiteSpace: 'nowrap' }}>
          En savoir plus
        </a>
      </p>
      <button
        onClick={() => choose('granted')}
        className="btn-primary"
        style={{ width: '100%', minHeight: 48, padding: '0 24px', justifyContent: 'center' }}
      >
        OK pour moi
      </button>
    </div>
  );
}
