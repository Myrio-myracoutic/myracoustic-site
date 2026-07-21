'use client';
import { useState } from 'react';

const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/* Calendrier compact avec dates réservées (rouge) + dates déjà demandées (point orange). */
export default function MiniCal({ selected, onSelect, onBookedClick, devisPending = {}, bookedDates = new Set(), yearsAhead = 1, loading = false }) {
  const startYr = TODAY.getFullYear();
  const YEARS   = Array.from({ length: yearsAhead + 1 }, (_, i) => startYr + i);
  const [year,  setYear]  = useState(startYr);
  const [month, setMonth] = useState(TODAY.getMonth());

  const dim  = new Date(year, month + 1, 0).getDate();
  const fd   = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const mk   = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const past = (d) => new Date(year, month, d) < TODAY;
  const horizon = new Date(TODAY.getFullYear() + yearsAhead, TODAY.getMonth(), TODAY.getDate());
  const withinYear = (d) => new Date(year, month, d) <= horizon;

  const canPrev = year > startYr || (year === startYr && month > TODAY.getMonth());
  const canNext = year < YEARS[YEARS.length - 1] || month < 11;

  const prevMonth = () => { if (!canPrev) return; if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (!canNext) return; if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const selectYear = (y) => { setYear(y); if (y === startYr && month < TODAY.getMonth()) setMonth(TODAY.getMonth()); };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 10, zIndex: 10, background: 'rgba(6,14,22,0.75)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <style>{`@keyframes mra-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 26, height: 26, border: '2px solid rgba(255,255,255,0.12)', borderTop: '2px solid var(--lime)', borderRadius: '50%', animation: 'mra-spin 0.75s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-display), sans-serif' }}>Chargement des disponibilités…</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, justifyContent: 'center' }}>
        {YEARS.map(y => (
          <button key={y} onClick={() => selectYear(y)} style={{
            background: year === y ? 'var(--lime)' : 'rgba(255,255,255,0.05)',
            color: year === y ? '#0d1b2a' : 'rgba(255,255,255,0.45)',
            border: `1px solid ${year === y ? 'var(--lime)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20, padding: '3px 12px', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: year === y ? 700 : 400, transition: 'all 0.2s',
          }}>{y}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} disabled={!canPrev} style={{ background: 'none', border: 'none', color: canPrev ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', cursor: canPrev ? 'pointer' : 'default', fontSize: 18, padding: '2px 8px' }}>‹</button>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 13 }}>{MONTHS_FR[month]} {year}</span>
        <button onClick={nextMonth} disabled={!canNext} style={{ background: 'none', border: 'none', color: canNext ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', cursor: canNext ? 'pointer' : 'default', fontSize: 18, padding: '2px 8px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3 }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = mk(d), avail = withinYear(d), pt = past(d), sel = selected === k;
          const booked = bookedDates.has(k);
          const pCount = avail && !pt && !booked ? (devisPending[k] ?? 0) : 0;
          const trueBlocked = !avail || pt;
          const blocked = trueBlocked || booked;
          // Dates réservées : cliquables si onBookedClick fourni (pour afficher un message), sinon désactivées.
          const bookedClickable = booked && !!onBookedClick;
          const handleClick = () => {
            if (trueBlocked) return;
            if (booked) { onBookedClick?.(k); return; }
            onSelect(k);
          };
          return (
            <button key={i} onClick={handleClick} disabled={trueBlocked || (booked && !onBookedClick)} style={{
              background: sel ? 'var(--lime)' : booked ? 'rgba(239,68,68,0.22)' : avail && !pt ? 'rgba(184,239,11,0.07)' : 'transparent',
              color: sel ? '#0d1b2a' : booked ? 'rgba(255,100,100,0.7)' : blocked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.82)',
              border: `1px solid ${sel ? 'var(--lime)' : booked ? 'rgba(239,68,68,0.6)' : avail && !pt ? 'rgba(184,239,11,0.25)' : 'transparent'}`,
              borderRadius: 5, padding: '5px 0', fontSize: 12, cursor: trueBlocked ? 'default' : (booked && !onBookedClick) ? 'default' : 'pointer',
              fontFamily: 'var(--font-display), sans-serif', fontWeight: sel ? 700 : 400, position: 'relative',
            }}>
              {d}
              {pCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, borderRadius: '50%', background: sel ? '#0d1b2a' : '#f97316' }} />}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.35)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', marginRight: 4 }} />Disponible</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f97316', marginRight: 4 }} />Déjà demandé</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginRight: 4 }} />Réservé</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />Indisponible</span>
      </div>
    </div>
  );
}
