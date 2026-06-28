'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';

export default function AdminPlanTableSection({ eventId }) {
  const [tables,  setTables]  = useState([]);
  const [persons, setPersons] = useState([]);
  const [guests,  setGuests]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/plan-de-table`);
    const data = await res.json();
    setTables(data.tables || []);
    setPersons(data.persons || []);
    setGuests(data.guests || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const guestName = useMemo(() => Object.fromEntries(guests.map(g => [g.id, g.first_name])), [guests]);
  const labelMap = useMemo(() => {
    const counters = {}; const m = {};
    [...persons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).forEach(p => {
      const k = p.guest_id + '|' + p.kind;
      counters[k] = (counters[k] || 0) + 1;
      m[p.id] = (p.kind === 'adult' ? 'Adulte ' : 'Enfant ') + counters[k];
    });
    return m;
  }, [persons]);
  const nameOf = (p) => p.name?.trim() || labelMap[p.id] || 'Convive';

  if (loading) return null;
  // Module non utilisé → rien à afficher
  if (tables.length === 0 && persons.length === 0) return null;

  const pool = persons.filter(p => !p.table_id);

  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
        Plan de table ({persons.filter(p => p.table_id).length}/{persons.length} placés)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {tables.map(t => {
          const occ = persons.filter(p => p.table_id === t.id);
          const over = occ.length > t.capacity;
          return (
            <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{t.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: over ? '#f59e0b' : '#b8ef0b' }}>{occ.length}/{t.capacity}</span>
              </div>
              {occ.length === 0
                ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Vide</span>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {occ.map(p => (
                      <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '2px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.kind === 'adult' ? '#b8ef0b' : '#60a5fa' }} />
                        {nameOf(p)} <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {p.guest_id ? (guestName[p.guest_id] || '—') : 'manuel'}</span>
                      </span>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {pool.length > 0 && (
        <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 12 }}>
          {pool.length} convive{pool.length > 1 ? 's' : ''} pas encore placé{pool.length > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
}
