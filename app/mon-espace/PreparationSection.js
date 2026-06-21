'use client';
import { useState } from 'react';

const CHECKLISTS = {
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

function getChecklist(eventType) {
  if (!eventType) return CHECKLISTS.default;
  const t = eventType.toLowerCase();
  if (t.includes('mariage')) return CHECKLISTS.mariage;
  if (t.includes('pacs')) return CHECKLISTS.pacs;
  if (t.includes('anniversaire') || t.includes('mitzvah') || t.includes('communion') || t.includes('familiale')) return CHECKLISTS.anniversaire;
  if (t.includes('séminaire') || t.includes('seminaire') || t.includes('gala') || t.includes('corporate') || t.includes('entreprise')) return CHECKLISTS.seminaire;
  return CHECKLISTS.default;
}

export default function PreparationSection({ ev, token }) {
  const items   = getChecklist(ev.event_type);
  const [checked, setChecked] = useState(Array.isArray(ev.checklist_checked) ? ev.checklist_checked : []);
  const [saving, setSaving]   = useState(false);

  const toggle = async (item) => {
    const next = checked.includes(item) ? checked.filter(i => i !== item) : [...checked, item];
    setChecked(next);
    setSaving(true);
    await fetch(`/api/mon-espace/checklist/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, checked: next }),
    });
    setSaving(false);
  };

  const done = items.filter(i => checked.includes(i)).length;

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Checklist de préparation</h3>
        <span style={{ fontSize: 12, color: done === items.length ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
          {done}/{items.length}{saving ? ' · enreg…' : ''}
        </span>
      </div>

      {done === items.length && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
          color: '#22c55e', fontWeight: 600,
        }}>✓ Toutes les étapes sont complètes — vous êtes prêt !</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div
              onClick={() => toggle(item)}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: checked.includes(item) ? '#b8ef0b' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${checked.includes(item) ? '#b8ef0b' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              {checked.includes(item) && (
                <span style={{ color: '#060e16', fontSize: 13, fontWeight: 900 }}>✓</span>
              )}
            </div>
            <span
              onClick={() => toggle(item)}
              style={{
                fontSize: 14, lineHeight: 1.5,
                color: checked.includes(item) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
                textDecoration: checked.includes(item) ? 'line-through' : 'none',
                transition: 'all 0.2s',
              }}
            >{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
