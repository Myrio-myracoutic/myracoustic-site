'use client';
import { useEffect, useState, useCallback } from 'react';
import { printMenu } from '@/app/lib/menu-pdf';

export default function AdminMenuSection({ eventId }) {
  const [config, setConfig] = useState(null);
  const [guests, setGuests] = useState([]);
  const [event, setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/menu`);
    const data = await res.json();
    setConfig(data.config || null);
    setGuests(data.guests || []);
    setEvent(data.event || null);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  // Module non utilisé pour cet événement → on n'affiche rien
  if (!config || !config.is_active) return null;

  const courses = Array.isArray(config.courses) ? config.courses : [];
  const present = guests.filter(g => g.attending === true);

  const peopleOf = (g) => {
    const list = (g.menu_response?.people) || [];
    let a = 0, c = 0;
    return list.map(p => ({ ...p, label: p.kind === 'adult' ? `Adulte ${++a}` : `Enfant ${++c}` }));
  };
  const personAnswered = (p) => (p.choices && Object.keys(p.choices).length > 0) || p.dietary || p.drink;
  const answered = present.filter(g => peopleOf(g).some(personAnswered));

  // Totaux par plat — comptés par PERSONNE
  const summary = courses.map(c => {
    const counts = {};
    for (const g of present) {
      for (const p of peopleOf(g)) {
        const choice = p.choices?.[c.key];
        if (choice) counts[choice] = (counts[choice] || 0) + 1;
      }
    }
    return { label: c.label, counts };
  });
  const totalCake = present.reduce((s, g) => s + (parseInt(g.menu_response?.cake) || 0), 0);

  const exportPDF = () => printMenu({
    courses,
    ask: { dietary: config.ask_dietary, cake: config.ask_cake, drinks: config.ask_drinks, comment: config.ask_comment },
    present,
    event,
  });

  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Menu & repas ({answered.length}/{present.length} présents)
        </h3>
        {answered.length > 0 && (
          <button onClick={exportPDF} style={{
            background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 7,
            padding: '6px 12px', cursor: 'pointer', color: '#b8ef0b', fontSize: 12, fontWeight: 600,
          }}>PDF traiteur</button>
        )}
      </div>

      {summary.some(s => Object.keys(s.counts).length > 0) || totalCake > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {summary.map(s => Object.keys(s.counts).length > 0 && (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              {Object.entries(s.counts).map(([opt, n]) => (
                <div key={opt} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{opt}</span>
                  <span style={{ color: '#b8ef0b', fontWeight: 700 }}>{n}</span>
                </div>
              ))}
            </div>
          ))}
          {config.ask_cake && totalCake > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Gâteau</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Parts</span>
                <span style={{ color: '#b8ef0b', fontWeight: 700 }}>{totalCake}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', margin: 0 }}>
          Aucune réponse menu pour l'instant.
        </p>
      )}

      {/* Allergies signalées — par personne, important pour le traiteur */}
      {config.ask_dietary && present.some(g => peopleOf(g).some(p => p.dietary)) && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Allergies / régimes signalés</div>
          {present.flatMap(g => peopleOf(g).filter(p => p.dietary).map((p, i) => (
            <div key={g.id + '-' + i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '2px 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{g.first_name}</span> <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {p.name ? `${p.label} (${p.name})` : p.label}</span> — <span style={{ color: '#f59e0b' }}>{p.dietary}</span>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}
