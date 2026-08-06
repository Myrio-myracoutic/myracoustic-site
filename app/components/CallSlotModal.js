'use client';
import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const card = { background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 };
const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '8px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const btnSm = { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 };

/* Modale admin de programmation/reprogrammation d'un appel — partagée par
   /admin/leads-mariage, /admin/prospects (devis + contact pro). `patchUrl`/`id`
   déterminent la fiche visée (mariage_leads, qonto_quotes_tracking ou
   pro_contact_leads — voir app/lib/call-booking.js pour le mapping des "kind"). */
export default function CallSlotModal({ id, mode, contactLabel, patchUrl, onClose, onDone }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxStr = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(false);
  const [time, setTime] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSlots = (d) => {
    setSlotsLoading(true); setSlotsError(false); setTime(null);
    fetch(`/api/admin/call-availability?date=${d}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlotsError(true))
      .finally(() => setSlotsLoading(false));
  };
  useEffect(() => { setError(''); loadSlots(date); }, [date]);

  const confirm = async () => {
    if (!time || saving) return;
    setSaving(true); setError('');
    const res = await fetch(patchUrl, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, setCall: { date, time } }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error === 'slot_taken' ? 'Ce créneau vient d\'être pris — choisissez-en un autre.' : (d.error || 'Erreur'));
      if (d.error === 'slot_taken') loadSlots(date);
      return;
    }
    onDone();
  };

  const fLabel = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, maxWidth: 480, width: '100%', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 800, margin: 0 }}>
            {mode === 'reschedule' ? 'Modifier le rendez-vous' : 'Programmer un appel'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 18px' }}>
          {contactLabel}
          {mode === 'reschedule' && ' — l\'ancien créneau sera libéré et l\'événement Google remplacé.'}
        </p>

        <label style={fLabel}>Jour</label>
        <input type="date" min={todayStr} max={maxStr} value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: '100%', marginBottom: 16 }} />

        <label style={fLabel}>Créneau</label>
        {slotsLoading ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '8px 0 0' }}>Chargement…</p>
        ) : slotsError ? (
          <p style={{ color: '#f59e0b', fontSize: 13, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Impossible de charger les créneaux.</p>
        ) : slots.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontStyle: 'italic', margin: '8px 0 0' }}>Aucun créneau disponible ce jour-là.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 7, marginTop: 8 }}>
            {slots.map(t => (
              <button key={t} onClick={() => setTime(t)} style={{
                ...btnSm, padding: '8px 0', textAlign: 'center',
                border: `1px solid ${time === t ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
                background: time === t ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.05)',
                color: time === t ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
              }}>{t}</button>
            ))}
          </div>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '16px 0 0' }}>{error}</p>}

        <button onClick={confirm} disabled={!time || saving} style={{
          width: '100%', marginTop: 20, background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 8, padding: '13px 0',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15,
          cursor: !time || saving ? 'not-allowed' : 'pointer', opacity: !time || saving ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</> : 'Confirmer le rendez-vous'}
        </button>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
          Le client reçoit un email de confirmation avec le jour et l'heure.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
