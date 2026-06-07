'use client';

import { useState, useEffect, useRef } from 'react';

function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);
  const [on, setOn] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!on) return;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [on, target, duration]);

  return [val, ref];
}

export default function StatItem({ value, suffix, label }) {
  const [count, ref] = useCountUp(parseInt(value));
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '0 16px' }}>
      <div style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 'clamp(38px,5vw,68px)', fontWeight: 700,
        color: 'var(--lime)', lineHeight: 1,
      }}>
        {count}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}
