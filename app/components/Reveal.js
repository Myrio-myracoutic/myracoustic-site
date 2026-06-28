'use client';
import { useRef, useState, useEffect } from 'react';

/* Apparition douce au défilement (fondu + léger glissé). Réutilisable sur les pages publiques.
   Respecte prefers-reduced-motion ; si JS/IO indisponible, affiche immédiatement. */
export default function Reveal({ children, delay = 0, style, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown]     = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setInstant(true); setShown(true); return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      ...style,
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : 'translateY(24px)',
      transition: instant ? 'none' : `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      willChange: 'opacity, transform',
    }} {...rest}>
      {children}
    </div>
  );
}
