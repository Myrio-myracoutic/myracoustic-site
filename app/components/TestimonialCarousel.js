'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from './TestimonialCard';

/* Avis clients sur une seule ligne qui défile (mobile : glissé tactile,
   ordinateur : flèches). Points de pagination + carte suivante qui dépasse
   pour montrer clairement qu'il y a d'autres avis. */
export default function TestimonialCarousel({ items }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const stride = () => {
    const el = trackRef.current;
    if (!el || !el.children[0]) return 1;
    return el.children[0].offsetWidth + 18; // largeur carte + gap
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / stride()));
  };

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: clamped * stride(), behavior: 'smooth' });
  };

  const arrowStyle = (side) => ({
    position: 'absolute', top: 'calc(50% - 14px)', [side]: -6, transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', zIndex: 3,
    background: 'rgba(13,27,42,0.92)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
  });

  return (
    <div style={{ position: 'relative' }}>
      <div ref={trackRef} onScroll={onScroll} className="testimonial-track" style={{
        display: 'flex', gap: 18, overflowX: 'auto', overflowY: 'hidden',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', paddingBottom: 6,
      }}>
        {items.map((t, i) => (
          <div key={i} style={{
            flex: '0 0 auto', width: 'min(82vw, 340px)',
            scrollSnapAlign: 'start', display: 'flex',
          }}>
            <TestimonialCard {...t} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button type="button" aria-label="Avis précédents" className="hide-mobile"
            onClick={() => goTo(active - 1)} style={arrowStyle('left')}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Avis suivants" className="hide-mobile"
            onClick={() => goTo(active + 1)} style={arrowStyle('right')}>
            <ChevronRight size={20} />
          </button>

          {/* Points de pagination — indiquent le nombre d'avis et la position */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
            {items.map((_, i) => (
              <button key={i} type="button" aria-label={`Avis ${i + 1}`}
                onClick={() => goTo(i)} style={{
                  width: i === active ? 22 : 8, height: 8, borderRadius: 4, padding: 0,
                  border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                  background: i === active ? 'var(--lime)' : 'rgba(255,255,255,0.22)',
                }} />
            ))}
          </div>
        </>
      )}

      <style>{`.testimonial-track::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
