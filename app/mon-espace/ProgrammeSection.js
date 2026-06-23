'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Printer, GripVertical, Check, X, Music2, ChevronDown, Info, Sparkles } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Sélecteur de playlists ─────────────────────────────────────── */
function PlaylistPicker({ item, allPlaylists, token, onChange }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef(null);
  const linked = (item.playlist_ids || []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = async (playlistId) => {
    const current = item.playlist_ids || [];
    const next = current.includes(playlistId)
      ? current.filter(id => id !== playlistId)
      : [...current, playlistId];
    setSaving(true);
    await fetch(`/api/mon-espace/programme/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ playlist_ids: next }),
    });
    setSaving(false);
    onChange({ ...item, playlist_ids: next });
  };

  const linkedPlaylists = allPlaylists.filter(p => linked.includes(p.id));

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {linkedPlaylists.map(p => (
          <span key={p.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)',
            borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#b8ef0b', fontWeight: 600,
          }}>
            <Music2 size={10} />
            {p.name}
            <button onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(184,239,11,0.5)', lineHeight: 1 }}>×</button>
          </span>
        ))}
        <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'none', border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
          }}>
          <Music2 size={10} /> {linkedPlaylists.length === 0 ? 'Lier une playlist' : '+'} <ChevronDown size={9} />
        </button>
        {saving && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>…</span>}
      </div>
      {open && allPlaylists.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 200,
        }}>
          {allPlaylists.map(p => {
            const isLinked = linked.includes(p.id);
            return (
              <button key={p.id} onClick={() => { toggle(p.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: isLinked ? '1.5px solid #b8ef0b' : '1.5px solid rgba(255,255,255,0.2)',
                  background: isLinked ? 'rgba(184,239,11,0.15)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isLinked && <Check size={10} color="#b8ef0b" />}
                </div>
                <span style={{ fontSize: 13, color: isLinked ? '#b8ef0b' : 'rgba(255,255,255,0.7)' }}>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Champ instructions ─────────────────────────────────────────── */
function InstructionsField({ item, token, onUpdate }) {
  const [value, setValue] = useState(item.instructions || '');
  const timer = useRef(null);

  const save = async (val) => {
    await fetch(`/api/mon-espace/programme/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ instructions: val }),
    });
    onUpdate({ ...item, instructions: val });
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(e.target.value), 700);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
        INSTRUCTIONS
      </label>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Notes pour cette étape : disposition, contacts, horaires précis, consignes aux prestataires…"
        rows={2}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 7, padding: '8px 12px', color: 'rgba(255,255,255,0.65)', fontSize: 12,
          fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
          boxSizing: 'border-box', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  );
}

/* ── Ligne du programme ─────────────────────────────────────────── */
function ItemRow({ item, allPlaylists, token, onDelete, onUpdate }) {
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

  const cancel = () => { setTime(item.time); setLabel(item.label); setEditing(false); };

  if (editing) {
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GripVertical size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,239,11,0.4)', borderRadius: 6, padding: '6px 10px', color: '#b8ef0b', fontSize: 13, fontFamily: 'var(--font-mono), monospace', width: 100, flexShrink: 0 }} />
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            autoFocus
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
          <button onClick={save} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8ef0b', padding: 4 }}><Check size={16} /></button>
          <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}><X size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        onClick={() => setEditing(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <GripVertical size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, fontWeight: 600, color: '#b8ef0b', width: 52, flexShrink: 0 }}>{item.time}</span>
        <span style={{ flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{item.label}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(item.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ paddingLeft: 26 }}>
        {/* Playlist liées */}
        <PlaylistPicker item={item} allPlaylists={allPlaylists} token={token} onChange={onUpdate} />

        {/* Instructions */}
        <InstructionsField item={item} token={token} onUpdate={onUpdate} />

        {/* Bandeau surprise Myracoustic (si révélé) */}
        {item.secret_visible && item.secret_animation && (
          <div style={{
            marginTop: 8,
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 8, padding: '8px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <Sparkles size={14} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 3, letterSpacing: '0.05em' }}>
                ✨ ANIMATION MYRACOUSTIC
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {item.secret_animation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Ajout d'une étape ─────────────────────────────────────────── */
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
    setTime(''); setLabel(''); setOpen(false);
    onAdded(data.item);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
      background: 'rgba(184,239,11,0.08)', border: '1px dashed rgba(184,239,11,0.3)',
      borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
      color: '#b8ef0b', fontSize: 13, fontWeight: 600,
      fontFamily: 'var(--font-display), sans-serif', width: '100%',
    }}>
      <Plus size={15} /> Ajouter une étape
    </button>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,239,11,0.25)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <input type="time" value={time} onChange={e => setTime(e.target.value)}
        style={{ background: 'transparent', border: '1px solid rgba(184,239,11,0.4)', borderRadius: 6, padding: '6px 10px', color: '#b8ef0b', fontSize: 13, fontFamily: 'var(--font-mono), monospace', width: 100, flexShrink: 0 }} />
      <input type="text" value={label} onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
        autoFocus placeholder="Ex : Cérémonie laïque, Cocktail, Dîner…"
        style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
      <button onClick={save} disabled={saving || !time || !label.trim()}
        style={{ background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-display), sans-serif', flexShrink: 0, opacity: (!time || !label.trim()) ? 0.4 : 1 }}>
        Ajouter
      </button>
      <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}><X size={16} /></button>
    </div>
  );
}

/* ── Export PDF ─────────────────────────────────────────────────── */
function printProgramme(ev, items, allPlaylists, client) {
  const date       = fmtDate(ev.event_date);
  const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : '';
  const eventType  = ev.event_type || 'Événement';
  const playlistMap = Object.fromEntries(allPlaylists.map(p => [p.id, p.name]));

  const rows = items.map((it, i) => {
    const linkedNames = (it.playlist_ids || []).map(id => playlistMap[id]).filter(Boolean);
    const playlistTag = linkedNames.length > 0
      ? `<div class="playlist-tag">${linkedNames.map(n => `<span class="ptag">♪ ${n}</span>`).join('')}</div>`
      : '';
    const instrTag = it.instructions
      ? `<div class="instr">${it.instructions}</div>`
      : '';
    const secretTag = it.secret_visible && it.secret_animation
      ? `<div class="secret">✨ ${it.secret_animation}</div>`
      : '';
    return `
    <div class="row">
      <div class="time-col"><span class="time-label">${it.time}</span></div>
      <div class="dot-col">
        <div class="dot"></div>
        ${i < items.length - 1 ? '<div class="line"></div>' : ''}
      </div>
      <div class="label-col">
        <span class="label-text">${it.label}</span>
        ${playlistTag}${instrTag}${secretTag}
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Programme — ${eventType}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; min-height: 297mm; display: flex; flex-direction: column; }
  .header { background: #060e16; padding: 28px 36px 24px; display: flex; align-items: flex-start; justify-content: space-between; }
  .brand-name { font-size: 18px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #b8ef0b; }
  .brand-tag { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 0.08em; margin-top: 3px; text-transform: uppercase; }
  .header-contact p { font-size: 11px; color: rgba(255,255,255,0.45); line-height: 1.8; text-align: right; }
  .accent-bar { height: 4px; background: #b8ef0b; }
  .event-block { padding: 32px 36px 28px; border-bottom: 1px solid #e8e8f0; }
  .event-type { font-size: 28px; font-weight: 800; color: #060e16; letter-spacing: -0.02em; margin-bottom: 6px; text-transform: uppercase; }
  .client-name { font-size: 16px; color: #444; font-weight: 500; margin-bottom: 10px; }
  .meta-pills { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  .pill { font-size: 11px; font-weight: 600; color: #060e16; background: #f0f0f5; border-radius: 20px; padding: 4px 12px; }
  .pill-accent { background: #b8ef0b; }
  .section-title { padding: 24px 36px 12px; font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.15em; text-transform: uppercase; }
  .timeline { padding: 0 36px 32px; flex: 1; }
  .row { display: flex; align-items: flex-start; min-height: 52px; }
  .time-col { width: 72px; padding-top: 2px; flex-shrink: 0; text-align: right; padding-right: 16px; }
  .time-label { font-size: 14px; font-weight: 700; color: #060e16; font-variant-numeric: tabular-nums; }
  .dot-col { width: 24px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #b8ef0b; border: 2px solid #060e16; flex-shrink: 0; margin-top: 4px; }
  .line { width: 2px; flex: 1; background: #e0e0ea; min-height: 32px; margin-top: 4px; }
  .label-col { padding-left: 14px; padding-top: 2px; flex: 1; padding-bottom: 8px; }
  .label-text { font-size: 15px; color: #1a1a2e; line-height: 1.5; }
  .playlist-tag { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .ptag { font-size: 10px; font-weight: 600; color: #4a6c0a; background: #eefac8; border-radius: 4px; padding: 2px 7px; }
  .instr { font-size: 12px; color: #666; font-style: italic; margin-top: 4px; line-height: 1.5; }
  .secret { font-size: 11px; color: #6d28d9; font-weight: 600; margin-top: 4px; background: #f3e8ff; border-radius: 4px; padding: 3px 8px; display: inline-block; }
  .footer { background: #f7f7fa; border-top: 1px solid #e8e8f0; padding: 16px 36px; display: flex; align-items: center; justify-content: space-between; }
  .footer-brand { font-size: 11px; font-weight: 700; color: #060e16; letter-spacing: 0.08em; text-transform: uppercase; }
  .footer-info { font-size: 10px; color: #999; text-align: right; line-height: 1.7; }
</style></head><body>
  <div class="header">
    <div><div class="brand-name">Myracoustic</div><div class="brand-tag">De la vibration sonore à la magie lumineuse</div></div>
    <div class="header-contact"><p>07 68 53 33 08</p><p>contact@myracoustic.com</p><p>myracoustic.com</p></div>
  </div>
  <div class="accent-bar"></div>
  <div class="event-block">
    <div class="event-type">${eventType}</div>
    ${clientName ? `<div class="client-name">${clientName}</div>` : ''}
    <div class="meta-pills">
      ${date ? `<span class="pill pill-accent">${date}</span>` : ''}
      ${ev.venue_city ? `<span class="pill">${ev.venue_city}</span>` : ''}
      ${ev.guests ? `<span class="pill">${ev.guests} personnes</span>` : ''}
    </div>
  </div>
  <div class="section-title">Programme de la journée</div>
  <div class="timeline">${rows}</div>
  <div class="footer">
    <div class="footer-brand">Myracoustic</div>
    <div class="footer-info">Document confidentiel — à distribuer aux prestataires<br>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

/* ── Section principale ─────────────────────────────────────────── */
export default function ProgrammeSection({ ev, token, client }) {
  const [items,     setItems]     = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showHelp,  setShowHelp]  = useState(false);

  const load = useCallback(async () => {
    const [progRes, playRes] = await Promise.all([
      fetch(`/api/mon-espace/programme/${ev.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`/api/mon-espace/playlists/${ev.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    const [progData, playData] = await Promise.all([progRes.json(), playRes.json()]);
    setItems(progData.items || []);
    setPlaylists(playData.playlists || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await fetch(`/api/mon-espace/programme/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i).sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleAdded = (item) => {
    setItems(prev => [...prev, item].sort((a, b) => a.time.localeCompare(b.time)));
  };

  if (loading) return <SkeletonCard lines={4} />;

  const hasSecret = items.some(i => i.secret_visible && i.secret_animation);

  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Programme de l'événement
          </h3>
          <button onClick={() => setShowHelp(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#b8ef0b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
            <Info size={14} />
          </button>
        </div>
        {items.length > 0 && (
          <button onClick={() => printProgramme(ev, items, playlists, client)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-display), sans-serif',
            }}>
            <Printer size={13} /> Télécharger / Imprimer
          </button>
        )}
      </div>

      {showHelp && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8,
        }}>
          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Comment utiliser le programme :</strong><br />
          • <strong>Ajoutez chaque étape</strong> avec l'heure et l'intitulé (Cérémonie, Cocktail, Dîner…)<br />
          • <strong>Instructions</strong> : notes internes pour chaque étape — visible dans le PDF distribué aux prestataires<br />
          • <strong>Liez une playlist</strong> à chaque moment pour indiquer la musique prévue<br />
          {hasSecret && (
            <>• <strong style={{ color: '#a78bfa' }}>✨ Animation Myracoustic</strong> : votre prestataire a préparé une surprise pour certaines étapes — les détails apparaissent quand ils décident de vous les révéler<br /></>
          )}
        </div>
      )}

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 20, marginTop: 4, lineHeight: 1.6 }}>
        Créez le déroulé de votre événement, ajoutez des instructions pour chaque étape et associez vos playlists. Le PDF peut être distribué à chaque prestataire.
      </p>

      {items.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>
          Aucune étape pour l'instant — commencez par ajouter la première.
        </p>
      )}
      {items.map(item => (
        <ItemRow key={item.id} item={item} allPlaylists={playlists} token={token} onDelete={handleDelete} onUpdate={handleUpdate} />
      ))}
      <AddRow eventId={ev.id} token={token} onAdded={handleAdded} />
    </div>
  );
}
