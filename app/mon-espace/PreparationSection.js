'use client';
import { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';

const DEFAULTS = {
  mariage: [
    'Date et salle de réception confirmées',
    'Chanson de la première danse choisie',
    'Brief musical envoyé à Myracoustic',
    'Planning de la soirée transmis',
    'Accès pour le matériel confirmé (horaires, ascenseur)',
    'Contacts du traiteur / wedding planner partagés',
  ],
  pacs: [
    'Date et lieu confirmés',
    'Brief musical envoyé à Myracoustic',
    'Planning de la soirée transmis',
    'Accès pour le matériel confirmé',
  ],
  anniversaire: [
    'Date et lieu confirmés',
    'Thème et ambiance définis',
    'Brief musical envoyé à Myracoustic',
    'Accès pour le matériel confirmé',
  ],
  seminaire: [
    'Date et lieu confirmés',
    'Programme de la journée transmis',
    'Brief technique envoyé (micro, écran, sonorisation)',
    'Accès et horaires de montage confirmés',
  ],
  default: [
    'Date et lieu confirmés',
    'Brief envoyé à Myracoustic',
    'Accès pour le matériel confirmé',
  ],
};

function getDefaults(eventType) {
  if (!eventType) return DEFAULTS.default;
  const t = eventType.toLowerCase();
  if (t.includes('mariage')) return DEFAULTS.mariage;
  if (t.includes('pacs')) return DEFAULTS.pacs;
  if (t.includes('anniversaire') || t.includes('mitzvah') || t.includes('communion') || t.includes('familiale')) return DEFAULTS.anniversaire;
  if (t.includes('séminaire') || t.includes('seminaire') || t.includes('gala') || t.includes('corporate') || t.includes('entreprise')) return DEFAULTS.seminaire;
  return DEFAULTS.default;
}

function initItems(ev) {
  if (Array.isArray(ev.checklist_items) && ev.checklist_items.length > 0) return ev.checklist_items;
  const checked = Array.isArray(ev.checklist_checked) ? ev.checklist_checked : [];
  return getDefaults(ev.event_type).map(text => ({ text, done: checked.includes(text) }));
}

const CARD = { background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 28px' };

export default function PreparationSection({ ev, token }) {
  const [items,      setItems]      = useState(() => initItems(ev));
  const [saving,     setSaving]     = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText,   setEditText]   = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [newText,    setNewText]    = useState('');

  const save = async (next) => {
    setSaving(true);
    await fetch(`/api/mon-espace/checklist/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, items: next }),
    });
    setSaving(false);
  };

  const toggle = (i) => {
    const next = items.map((item, idx) => idx === i ? { ...item, done: !item.done } : item);
    setItems(next);
    save(next);
  };

  const startEdit = (i) => { setEditingIdx(i); setEditText(items[i].text); };

  const saveEdit = (i) => {
    const text = editText.trim();
    setEditingIdx(null);
    if (!text || text === items[i].text) return;
    const next = items.map((item, idx) => idx === i ? { ...item, text } : item);
    setItems(next);
    save(next);
  };

  const deleteItem = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    save(next);
  };

  const confirmAdd = () => {
    const text = newText.trim();
    setNewText('');
    setShowAdd(false);
    if (!text) return;
    const next = [...items, { text, done: false }];
    setItems(next);
    save(next);
  };

  const done = items.filter(i => i.done).length;

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Checklist de préparation</h3>
        <span style={{ fontSize: 12, color: done === items.length && items.length > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
          {done}/{items.length}{saving ? ' · enreg…' : ''}
        </span>
      </div>

      {done === items.length && items.length > 0 && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
          color: '#22c55e', fontWeight: 600,
        }}>✓ Toutes les étapes sont complètes — vous êtes prêt !</div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 10px', borderRadius: 8,
              background: editingIdx === i ? 'rgba(255,255,255,0.04)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {/* Checkbox */}
            <div
              onClick={() => toggle(i)}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: item.done ? '#b8ef0b' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${item.done ? '#b8ef0b' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              {item.done && <span style={{ color: '#060e16', fontSize: 13, fontWeight: 900 }}>✓</span>}
            </div>

            {/* Texte / éditeur inline */}
            {editingIdx === i ? (
              <input
                autoFocus
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={() => saveEdit(i)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') setEditingIdx(null); }}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 14, fontFamily: 'inherit',
                  borderBottom: '1px solid rgba(184,239,11,0.4)',
                  padding: '2px 0',
                }}
              />
            ) : (
              <span
                onClick={() => startEdit(i)}
                title="Cliquer pour modifier"
                style={{
                  flex: 1, fontSize: 14, lineHeight: 1.5, cursor: 'text',
                  color: item.done ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.75)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  transition: 'color 0.2s',
                }}
              >{item.text}</span>
            )}

            {/* Bouton supprimer */}
            <button
              onClick={() => deleteItem(i)}
              title="Supprimer"
              style={{
                flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.15)', padding: 4, borderRadius: 4, display: 'flex',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Ajouter une étape */}
      <div style={{ marginTop: 16 }}>
        {showAdd ? (
          <input
            autoFocus
            placeholder="Nouvelle étape…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onBlur={confirmAdd}
            onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewText(''); } }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(184,239,11,0.3)', borderRadius: 8,
              padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', fontSize: 13,
              fontFamily: 'var(--font-display), sans-serif',
              width: '100%', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(184,239,11,0.4)'; e.currentTarget.style.color = '#b8ef0b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >
            <Plus size={15} /> Ajouter une étape
          </button>
        )}
      </div>
    </div>
  );
}
