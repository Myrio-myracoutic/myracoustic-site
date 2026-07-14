'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from './TestimonialCard';

/* Avis clients sur une seule ligne qui défile (mobile : glissé tactile,
   ordinateur : flèches). Évite que les avis longs empilent en hauteur. */
export default function TestimonialCarousel({ items }) {
  const trackRef = useRef(null);

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrowStyle = (side) => ({
    position: 'absolute', top: '50%', [side]: -6, transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', zIndex: 3,
    background: 'rgba(13,27,42,0.92)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
  });

  return (
    <div style={{ position: 'relative' }}>
      <div ref={trackRef} className="testimonial-track" style={{
        display: 'flex', gap: 18, overflowX: 'auto', overflowY: 'hidden',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', paddingBottom: 6,
      }}>
        {items.map((t, i) => (
          <div key={i} style={{
            flex: '0 0 auto', width: 'min(85vw, 340px)',
            scrollSnapAlign: 'start', display: 'flex',
          }}>
            <TestimonialCard {...t} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button type="button" aria-label="Avis précédents" className="hide-mobile"
            onClick={() => scrollByCard(-1)} style={arrowStyle('left')}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Avis suivants" className="hide-mobile"
            onClick={() => scrollByCard(1)} style={arrowStyle('right')}>
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <style>{`.testimonial-track::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
