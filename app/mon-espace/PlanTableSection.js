'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { LayoutGrid, Plus, X, Trash2, Pencil, Check, Users, ArrowRightLeft } from 'lucide-react';

const card = {
  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px', marginBottom: 16,
};

/* Chip d'un convive — composant module-level (état d'édition local, focus préservé) */
function PersonChip({ p, inTable, label, guestLabel, isSelected, onSelect, onUnassign, onDelete, onRename, onDragStart }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(p.name || '');
  const kindColor = p.kind === 'adult' ? '#b8ef0b' : '#60a5fa';

  if (editing) {
    const commit = () => { onRename(p.id, val.trim()); setEditing(false); };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          placeholder={label}
          style={{ width: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,239,11,0.4)', borderRadius: 8, padding: '4px 8px', color: '#fff', fontSize: 12, outline: 'none' }} />
        <button onClick={commit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8ef0b', padding: 2 }}><Check size={13} /></button>
      </span>
    );
  }

  const display = p.name?.trim() || label;
  return (
    <span
      draggable
      onDragStart={() => onDragStart(p.id)}
      onClick={() => onSelect(p.id)}
      title="Cliquer pour sélectionner, puis cliquer une table — ou glisser-déposer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        background: isSelected ? 'rgba(184,239,11,0.2)' : (inTable ? 'rgba(255,255,255,0.05)' : 'rgba(184,239,11,0.08)'),
        border: `1px solid ${isSelected ? 'rgba(184,239,11,0.6)' : (inTable ? 'rgba(255,255,255,0.1)' : 'rgba(184,239,11,0.2)')}`,
        color: isSelected ? '#b8ef0b' : 'rgba(255,255,255,0.85)',
        borderRadius: 10, padding: '5px 9px', fontSize: 12.5, fontWeight: 500,
      }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: kindColor, flexShrink: 0 }} />
      {display}
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>· {guestLabel}</span>
      <button onClick={e => { e.stopPropagation(); setVal(p.name || ''); setEditing(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}><Pencil size={11} /></button>
      {inTable && (
        <button onClick={e => { e.stopPropagation(); onUnassign(p.id); }} title="Retirer de la table (vers le vivier)"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><X size={12} /></button>
      )}
      {!p.guest_id && (
        <button onClick={e => { e.stopPropagation(); onDelete(p.id); }} title="Supprimer ce convive"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}><Trash2 size={11} /></button>
      )}
    </span>
  );
}

/* Mini-formulaire d'ajout manuel — module-level (état local) */
function AddPerson({ tableId, compact, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('adult');
  const submit = async () => {
    if (!name.trim()) return;
    const ok = await onAdd(name.trim(), kind, tableId);
    if (ok) { setName(''); setKind('adult'); setOpen(false); }
  };
  if (!open) return (
    <button onClick={e => { e.stopPropagation(); setOpen(true); }} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none',
      border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 10, padding: compact ? '3px 8px' : '5px 10px',
      cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500,
    }}><Plus size={12} /> {compact ? 'Personne' : 'Ajouter une personne'}</button>
  );
  const kindPill = (k) => {
    const active = kind === k;
    const col = k === 'adult' ? '#b8ef0b' : '#60a5fa';
    return (
      <button key={k} onClick={() => setKind(k)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
        background: active ? `${col}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? col : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: active ? 700 : 500,
        color: active ? col : 'rgba(255,255,255,0.45)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: col, opacity: active ? 1 : 0.4 }} />
        {k === 'adult' ? 'Adulte' : 'Enfant'}
      </button>
    );
  };
  return (
    <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Nom du convive"
        style={{ width: 140, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,239,11,0.4)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>C'est&nbsp;:</span>
        {kindPill('adult')}
        {kindPill('child')}
      </span>
      <button onClick={submit} disabled={!name.trim()} style={{
        background: name.trim() ? '#b8ef0b' : 'rgba(184,239,11,0.3)', color: '#060e16', border: 'none', borderRadius: 8,
        padding: '6px 14px', cursor: name.trim() ? 'pointer' : 'default', fontWeight: 700, fontSize: 12,
        fontFamily: 'var(--font-display), sans-serif', display: 'inline-flex', alignItems: 'center', gap: 5,
      }}><Plus size={13} /> Ajouter</button>
      <button onClick={() => setOpen(false)} title="Annuler" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2, display: 'flex' }}><X size={14} /></button>
    </span>
  );
}

export default function PlanTableSection({ ev, token }) {
  const [tables,  setTables]  = useState([]);
  const [persons, setPersons] = useState([]);
  const [guests,  setGuests]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const draggedId = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/mon-espace/plan-de-table/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTables(data.tables || []);
    setPersons(data.persons || []);
    setGuests(data.guests || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const guestName = useMemo(() => Object.fromEntries(guests.map(g => [g.id, g.first_name])), [guests]);

  // Libellé "Adulte N / Enfant N" par invité
  const labelMap = useMemo(() => {
    const counters = {}; const m = {};
    [...persons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).forEach(p => {
      const k = (p.guest_id || 'manuel') + '|' + p.kind;
      counters[k] = (counters[k] || 0) + 1;
      m[p.id] = (p.kind === 'adult' ? 'Adulte ' : 'Enfant ') + counters[k];
    });
    return m;
  }, [persons]);

  const guestLabelOf = (p) => p.guest_id ? (guestName[p.guest_id] || '—') : 'manuel';

  // ── Actions ─────────────────────────────────────────────
  const assign = async (personId, tableId) => {
    setPersons(prev => prev.map(p => p.id === personId ? { ...p, table_id: tableId } : p));
    setSelected(null);
    await fetch(`/api/mon-espace/plan-de-table/persons/${personId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tableId }),
    });
  };

  const selectPerson = (id) => setSelected(prev => prev === id ? null : id);

  const addTable = async () => {
    const res = await fetch(`/api/mon-espace/plan-de-table/${ev.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.table) setTables(prev => [...prev, data.table]);
  };

  const updateTable = async (tableId, patch) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...patch } : t));
    await fetch(`/api/mon-espace/plan-de-table/tables/${tableId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
  };

  const deleteTable = async (tableId) => {
    if (!confirm('Supprimer cette table ? Ses convives repasseront dans le vivier (les ajouts manuels y compris).')) return;
    setTables(prev => prev.filter(t => t.id !== tableId));
    setPersons(prev => prev.map(p => p.table_id === tableId ? { ...p, table_id: null } : p));
    await fetch(`/api/mon-espace/plan-de-table/tables/${tableId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  };

  const renamePerson = async (personId, name) => {
    setPersons(prev => prev.map(p => p.id === personId ? { ...p, name: name || null } : p));
    await fetch(`/api/mon-espace/plan-de-table/persons/${personId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
  };

  const addManualPerson = async (name, kind, tableId) => {
    const res = await fetch(`/api/mon-espace/plan-de-table/${ev.id}/persons`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, kind, tableId }),
    });
    const data = await res.json();
    if (data.person) setPersons(prev => [...prev, data.person]);
    return !!data.person;
  };

  const deletePerson = async (personId) => {
    setPersons(prev => prev.filter(p => p.id !== personId));
    await fetch(`/api/mon-espace/plan-de-table/persons/${personId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  };

  // ── Drag & drop (desktop) ───────────────────────────────
  const onDragStart = (id) => { draggedId.current = id; };
  const onDropTo = (tableId) => (e) => { e.preventDefault(); if (draggedId.current) assign(draggedId.current, tableId); draggedId.current = null; };
  const allowDrop = (e) => e.preventDefault();

  const pool = persons.filter(p => !p.table_id);
  const poolByGuest = useMemo(() => {
    const groups = {};
    pool.forEach(p => { const k = p.guest_id || 'manuel'; (groups[k] = groups[k] || []).push(p); });
    return groups;
  }, [pool]);

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</p>;

  const totalPlaced = persons.filter(p => p.table_id).length;

  const chipProps = (p, inTable) => ({
    p, inTable, label: labelMap[p.id] || 'Convive', guestLabel: guestLabelOf(p),
    isSelected: selected === p.id, onSelect: selectPerson, onUnassign: id => assign(id, null),
    onDelete: deletePerson, onRename: renamePerson, onDragStart,
  });

  return (
    <div>
      {/* Intro */}
      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(184,239,11,0.06), rgba(184,239,11,0.02))', border: '1px solid rgba(184,239,11,0.15)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <LayoutGrid size={20} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Plan de table</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Créez vos tables, puis placez chaque convive : <strong style={{ color: 'rgba(255,255,255,0.75)' }}>touchez une personne du vivier puis une table</strong> (ou glissez-déposez sur ordinateur).
              Pas d'invitations ? Ajoutez vos convives <strong style={{ color: 'rgba(255,255,255,0.75)' }}>manuellement</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Vivier des non placés */}
      <div style={card} onDragOver={allowDrop} onDrop={onDropTo(null)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            À placer ({pool.length})
          </h3>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{totalPlaced}/{persons.length} placés</span>
        </div>

        {persons.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px', lineHeight: 1.6 }}>
            Aucun convive pour l'instant. Ajoutez-en <strong style={{ color: 'rgba(255,255,255,0.7)' }}>manuellement</strong> ci-dessous, ou invitez des personnes dans la section <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Invités</strong> (les présents confirmés apparaîtront ici automatiquement).
          </p>
        ) : pool.length === 0 ? (
          <p style={{ fontSize: 13, color: '#b8ef0b', margin: '0 0 12px' }}>✓ Tous vos convives sont placés.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {Object.entries(poolByGuest).map(([gid, ppl]) => (
              <div key={gid} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', minWidth: 70 }}>{gid === 'manuel' ? 'Ajouts manuels' : (guestName[gid] || '—')} :</span>
                {ppl.map(p => <PersonChip key={p.id} {...chipProps(p, false)} />)}
              </div>
            ))}
          </div>
        )}

        <AddPerson tableId={null} onAdd={addManualPerson} />

        {selected && (
          <p style={{ fontSize: 12, color: '#b8ef0b', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowRightLeft size={13} /> Touchez une table ci-dessous pour y placer la personne sélectionnée.
          </p>
        )}
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
        {tables.map(t => {
          const occ = persons.filter(p => p.table_id === t.id);
          const over = occ.length > t.capacity;
          return (
            <div key={t.id} onDragOver={allowDrop} onDrop={onDropTo(t.id)}
              onClick={() => { if (selected) assign(selected, t.id); }}
              style={{
                background: '#0d1b2a', borderRadius: 12, padding: 16,
                border: selected ? '1px dashed rgba(184,239,11,0.5)' : '1px solid rgba(255,255,255,0.08)',
                cursor: selected ? 'pointer' : 'default',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input value={t.name} onChange={e => updateTable(t.id, { name: e.target.value })} onClick={e => e.stopPropagation()}
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif', outline: 'none', padding: '2px 0' }} />
                <button onClick={e => { e.stopPropagation(); deleteTable(t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}><Trash2 size={14} /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: over ? '#f59e0b' : '#b8ef0b' }}>
                  <Users size={12} /> {occ.length}/{t.capacity}
                </span>
                {over && <span style={{ fontSize: 11, color: '#f59e0b' }}>⚠ table pleine</span>}
                <span onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Capacité
                  <input type="number" min={1} max={50} value={t.capacity} onClick={e => e.stopPropagation()}
                    onChange={e => updateTable(t.id, { capacity: parseInt(e.target.value) || 1 })}
                    style={{ width: 46, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 6px', color: '#fff', fontSize: 12, textAlign: 'center' }} />
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 28 }}>
                {occ.length === 0
                  ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Table vide — placez des convives ici.</span>
                  : occ.map(p => <PersonChip key={p.id} {...chipProps(p, true)} />)}
              </div>
              <div style={{ marginTop: 8 }}><AddPerson tableId={t.id} compact onAdd={addManualPerson} /></div>
            </div>
          );
        })}
      </div>

      <button onClick={addTable} style={{
        background: 'rgba(184,239,11,0.08)', border: '1px dashed rgba(184,239,11,0.3)', borderRadius: 10,
        padding: '12px 18px', cursor: 'pointer', color: '#b8ef0b', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
        fontFamily: 'var(--font-display), sans-serif',
      }}>
        <Plus size={15} /> Ajouter une table
      </button>
    </div>
  );
}
