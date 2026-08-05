'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check, Loader2, Phone } from 'lucide-react';

const card = { background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 };
const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '8px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' };
const btnSm = { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 };

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

let uid = 0;
const nextId = () => `r${++uid}`;

function emptyDays() {
  return WEEKDAYS.map((_, weekday) => ({ weekday, enabled: weekday < 5, ranges: [{ id: nextId(), start: '09:00', end: '18:00' }] }));
}

export default function PlanningAppelsPage() {
  const router = useRouter();
  const [days, setDays] = useState(emptyDays());
  const [slotDuration, setSlotDuration] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/call-schedule')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(data => {
        if (!data) return;
        const byWeekday = {};
        for (const row of data.rows || []) {
          if (!byWeekday[row.weekday]) byWeekday[row.weekday] = [];
          byWeekday[row.weekday].push({ id: nextId(), start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) });
        }
        setDays(WEEKDAYS.map((_, weekday) => ({
          weekday,
          enabled: !!byWeekday[weekday]?.length,
          ranges: byWeekday[weekday]?.length ? byWeekday[weekday] : [{ id: nextId(), start: '09:00', end: '18:00' }],
        })));
        setSlotDuration(data.slotDurationMinutes || 15);
        setLoading(false);
      });
  }, [router]);

  const updateDay = (weekday, patch) => {
    setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, ...patch } : d));
  };
  const updateRange = (weekday, rangeId, patch) => {
    setDays(prev => prev.map(d => d.weekday !== weekday ? d : {
      ...d, ranges: d.ranges.map(r => r.id === rangeId ? { ...r, ...patch } : r),
    }));
  };
  const addRange = (weekday) => {
    setDays(prev => prev.map(d => d.weekday !== weekday ? d : {
      ...d, ranges: [...d.ranges, { id: nextId(), start: '09:00', end: '18:00' }],
    }));
  };
  const removeRange = (weekday, rangeId) => {
    setDays(prev => prev.map(d => d.weekday !== weekday ? d : {
      ...d, ranges: d.ranges.filter(r => r.id !== rangeId),
    }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const payload = {
      days: days.map(d => ({ weekday: d.weekday, enabled: d.enabled, ranges: d.ranges.map(r => ({ start: r.start, end: r.end })) })),
      slotDurationMinutes: Number(slotDuration),
    };
    const res = await fetch('/api/admin/call-schedule', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Enregistrement échoué'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '36px 36px 60px', maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Phone size={20} color="#b8ef0b" />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Planning appels</h1>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
        Jours et horaires où des créneaux d'appel sont proposés aux leads mariage (page « choisir un créneau d'appel »).
        Un jour de prestation dans l'agenda Google bloque automatiquement tous les créneaux de ce jour-là, quel que soit ce planning.
      </p>

      <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: '#fff', fontSize: 14 }}>
          Durée d'un créneau
        </label>
        <input type="number" min={5} max={240} step={5} value={slotDuration}
          onChange={e => setSlotDuration(e.target.value)}
          style={{ ...inp, width: 80 }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>minutes</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days.map(d => (
          <div key={d.weekday} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: d.enabled ? 12 : 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 130 }}>
                <input type="checkbox" checked={d.enabled} onChange={e => updateDay(d.weekday, { enabled: e.target.checked })} style={{ accentColor: '#b8ef0b', width: 16, height: 16 }} />
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: d.enabled ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14 }}>{WEEKDAYS[d.weekday]}</span>
              </label>
              {!d.enabled && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Fermé aux appels</span>}
            </div>

            {d.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 26 }}>
                {d.ranges.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="time" value={r.start} onChange={e => updateRange(d.weekday, r.id, { start: e.target.value })} style={{ ...inp, width: 110 }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>à</span>
                    <input type="time" value={r.end} onChange={e => updateRange(d.weekday, r.id, { end: e.target.value })} style={{ ...inp, width: 110 }} />
                    {d.ranges.length > 1 && (
                      <button onClick={() => removeRange(d.weekday, r.id)} title="Supprimer cette plage" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', display: 'flex' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addRange(d.weekday)} style={{ ...btnSm, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 12 }}>
                  <Plus size={13} /> Ajouter une plage
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16 }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <button onClick={save} disabled={saving} style={{
          border: 'none', background: '#b8ef0b', color: '#060e16', borderRadius: 8, padding: '10px 22px',
          cursor: saving ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
          display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Enregistrer'}
        </button>
        {saved && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
            <Check size={15} /> Enregistré
          </span>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
