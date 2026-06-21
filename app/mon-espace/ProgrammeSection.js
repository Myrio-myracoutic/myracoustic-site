'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Printer, GripVertical, Check, X } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function ItemRow({ item, token, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [time,  setTime]  = useState(item.time);
  const [label, setLabel] = useState(item.label);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!time || !label.trim()) return;
    setSaving(true);
    await fetch(`/api/mon-espace/programme/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ time, label: label.trim() }),
    });
    setSaving(false);
    onUpdate({ ...item, time, label: label.trim() });
    setEditing(false);
  };

  const cancel = () => {
    setTime(item.time);
    setLabel(item.label);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <GripVertical size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,239,11,0.4)',
            borderRadius: 6, padding: '6px 10px', color: '#b8ef0b',
            fontSize: 13, fontFamily: 'var(--font-mono), monospace', width: 100, flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          autoFocus
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
          }}
        />
        <button onClick={save} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8ef0b', padding: 4 }}>
          <Check size={16} />
        </button>
        <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <GripVertical size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-mono), monospace', fontSize: 13, fontWeight: 600,
        color: '#b8ef0b', width: 52, flexShrink: 0,
      }}>{item.time}</span>
      <span style={{ flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{item.label}</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(item.id); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function AddRow({ eventId, token, onAdded }) {
  const [open, setOpen]   = useState(false);
  const [time, setTime]   = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!time || !label.trim()) return;
    setSaving(true);
    const res  = await fetch(`/api/mon-espace/programme/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ time, label: label.trim(), position: 0 }),
    });
    const data = await res.json();
    setSaving(false);
    setTime('');
    setLabel('');
    setOpen(false);
    onAdded(data.item);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
          background: 'rgba(184,239,11,0.08)', border: '1px dashed rgba(184,239,11,0.3)',
          borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
          color: '#b8ef0b', fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display), sans-serif', width: '100%',
        }}
      >
        <Plus size={15} /> Ajouter une étape
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,239,11,0.25)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        style={{
          background: 'transparent', border: '1px solid rgba(184,239,11,0.4)',
          borderRadius: 6, padding: '6px 10px', color: '#b8ef0b',
          fontSize: 13, fontFamily: 'var(--font-mono), monospace', width: 100, flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
        autoFocus
        placeholder="Ex : Cérémonie laïque, Cocktail, Dîner…"
        style={{
          flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
        }}
      />
      <button
        onClick={save}
        disabled={saving || !time || !label.trim()}
        style={{
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 6,
          padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          fontFamily: 'var(--font-display), sans-serif', flexShrink: 0,
          opacity: (!time || !label.trim()) ? 0.4 : 1,
        }}
      >Ajouter</button>
      <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
        <X size={16} />
      </button>
    </div>
  );
}

function printProgramme(ev, items) {
  const date = fmtDate(ev.event_date);
  const rows = items
    .map(it => `<tr><td class="time">${it.time}</td><td class="label">${it.label}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Programme — ${ev.event_type || 'Événement'}</title>
<style>
  @page { margin: 30mm 20mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { font-size: 13px; color: #555; margin: 0 0 32px; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #eee; }
  td { padding: 12px 8px; font-size: 14px; }
  .time { width: 80px; font-weight: 700; color: #1a1a1a; white-space: nowrap; }
  .label { color: #333; }
  .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
  <h1>${ev.event_type || 'Événement'}</h1>
  <p class="subtitle">${date}${ev.venue_city ? ' · ' + ev.venue_city : ''}${ev.guests ? ' · ' + ev.guests + ' personnes' : ''}</p>
  <table>${rows}</table>
  <div class="footer">Myracoustic · contact@myracoustic.com · 07 68 53 33 08</div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

export default function ProgrammeSection({ ev, token }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/programme/${ev.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await fetch(`/api/mon-espace/programme/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i)
      .sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleAdded = (item) => {
    setItems(prev => [...prev, item].sort((a, b) => a.time.localeCompare(b.time)));
  };

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Programme de l'événement</h3>
        {items.length > 0 && (
          <button
            onClick={() => printProgramme(ev, items)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            <Printer size={13} /> Télécharger / Imprimer
          </button>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 20, marginTop: 4, lineHeight: 1.6 }}>
        Créez le déroulé de votre événement. Vous pourrez le télécharger en PDF pour le distribuer à chaque prestataire.
      </p>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Chargement…</p>
      ) : (
        <>
          {items.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>
              Aucune étape pour l'instant — commencez par ajouter la première.
            </p>
          )}
          {items.map(item => (
            <ItemRow key={item.id} item={item} token={token} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
          <AddRow eventId={ev.id} token={token} onAdded={handleAdded} />
        </>
      )}
    </div>
  );
}
