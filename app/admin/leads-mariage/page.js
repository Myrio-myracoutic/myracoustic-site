'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, X, FileText, Check, Loader2, Heart } from 'lucide-react';
import { FORMULES, POLES, EXTRA_HOUR_PRICE, fmtPrice } from '@/app/lib/formules';

const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const card = { background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 };
const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '8px 10px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const btnSm = { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 };

let uid = 0;
const nextId = () => `l${++uid}`;

function DevisBuilder({ lead, proposal, onClose, onDone }) {
  const editing = !!proposal;
  const [formuleKey, setFormuleKey] = useState(proposal?.formule || '');
  const [items, setItems] = useState(() => (proposal?.items || []).map(it => ({ ...it, id: nextId() })));
  const [hours, setHours] = useState(() => {
    const h = (proposal?.items || []).find(it => it.source === 'hours');
    return h ? Math.round(Number(h.price) / EXTRA_HOUR_PRICE) : 0;
  });
  const [note, setNote] = useState(proposal?.admin_note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const formule = FORMULES.find(f => f.key === formuleKey);
  const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0);

  const pickFormule = (key) => {
    if (key === formuleKey) return; // ne pas réinitialiser si on reclique la formule active
    const f = FORMULES.find(x => x.key === key);
    setFormuleKey(key);
    setHours(0);
    setItems(f ? [{ id: nextId(), title: `Formule ${f.name} — Mariage`, price: f.price, source: 'formule' }] : []);
  };

  const hasOption = (k) => items.some(it => it.source === `option:${k}`);
  const toggleOption = (o) => {
    setItems(prev => hasOption(o.key)
      ? prev.filter(it => it.source !== `option:${o.key}`)
      : [...prev, { id: nextId(), title: o.label, price: o.price, source: `option:${o.key}` }]);
  };

  const setHoursQty = (n) => {
    const q = Math.max(0, n);
    setHours(q);
    setItems(prev => {
      const without = prev.filter(it => it.source !== 'hours');
      if (q === 0) return without;
      return [...without, { id: nextId(), title: `Heures DJ supplémentaires (${q}h)`, price: q * EXTRA_HOUR_PRICE, source: 'hours' }];
    });
  };

  const addCustom = () => setItems(prev => [...prev, { id: nextId(), title: '', price: 0, source: 'custom' }]);
  const updateItem = (id, field, value) => setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const save = async () => {
    if (saving) return;
    const clean = items.filter(it => it.title.trim() && Number(it.price) > 0)
      .map(it => ({ title: it.title.trim(), price: Number(it.price), source: it.source }));
    if (clean.length === 0) { setError('Ajoutez au moins une ligne (titre + prix).'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/admin/devis-proposal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: proposal?.id, leadId: lead.id, formule: formuleKey || null,
        formuleName: formule ? formule.name : 'Sur-mesure',
        items: clean, total, adminNote: note.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Erreur'); return; }
    onDone();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, maxWidth: 640, width: '100%', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 800, margin: 0 }}>{editing ? 'Modifier le devis' : 'Faire un devis'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, margin: '0 0 18px' }}>
          {lead.prenom} {lead.nom} · {fmtDate(lead.event_date)} · {lead.guests || '?'} pers. · {lead.lieu || 'lieu ?'}
        </p>

        {/* Formule */}
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>Formule de base</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {FORMULES.map(f => (
            <button key={f.key} onClick={() => pickFormule(f.key)} style={{
              ...btnSm, flex: '1 1 120px',
              border: `1px solid ${formuleKey === f.key ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
              background: formuleKey === f.key ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.05)',
              color: formuleKey === f.key ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
            }}>{f.name}<br /><span style={{ fontSize: 11, opacity: 0.7 }}>{fmtPrice(f.price)}</span></button>
          ))}
        </div>

        {formule && (
          <>
            {/* Ce qui est compris dans la formule */}
            <div style={{ background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 8 }}>Compris dans la formule {formule.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {POLES.map(p => {
                  const raw = formule.specs[p.key];
                  if (!raw || /^en option/i.test(raw)) return null;
                  const val = raw.split('·').map(s => s.trim()).filter(s => s && !/en option/i.test(s)).join(' · ');
                  if (!val) return null;
                  return (
                    <div key={p.key} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                      <Check size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{p.key === 'ceremonie'
                        ? <span style={{ color: '#fff', fontWeight: 600 }}>{val}</span>
                        : <><span style={{ color: '#fff', fontWeight: 600 }}>{p.label}</span> — {val}</>}</span>
                    </div>
                  );
                })}
                {formule.platform && (
                  <div style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <Check size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><span style={{ color: '#fff', fontWeight: 600 }}>Espace en ligne</span> — {formule.platform}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 7, marginBottom: 14 }}>
              {formule.options.map(o => (
                <button key={o.key} onClick={() => toggleOption(o)} style={{
                  ...btnSm, textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 8,
                  border: `1px solid ${hasOption(o.key) ? 'var(--lime)' : 'rgba(255,255,255,0.12)'}`,
                  background: hasOption(o.key) ? 'rgba(184,239,11,0.08)' : 'rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 12.5 }}>{o.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: 'nowrap' }}>+{o.price} €</span>
                </button>
              ))}
            </div>

            {/* Heures DJ */}
            {formule.key !== 'prestige' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Heures DJ supplémentaires ({EXTRA_HOUR_PRICE} €/h)</span>
                <button onClick={() => setHoursQty(hours - 1)} style={{ ...btnSm, padding: '5px 9px' }}><Minus size={13} /></button>
                <span style={{ width: 20, textAlign: 'center', fontWeight: 700 }}>{hours}</span>
                <button onClick={() => setHoursQty(hours + 1)} style={{ ...btnSm, padding: '5px 9px' }}><Plus size={13} /></button>
              </div>
            )}
          </>
        )}

        {/* Lignes du devis (éditables) */}
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>Lignes du devis (modifiables)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
          {items.length === 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Choisissez une formule ou ajoutez une ligne sur-mesure.</p>}
          {items.map(it => (
            <div key={it.id} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <input value={it.title} onChange={e => updateItem(it.id, 'title', e.target.value)} placeholder="Désignation" style={{ ...inp, flex: 1 }} />
              <input type="number" value={it.price} onChange={e => updateItem(it.id, 'price', e.target.value)} style={{ ...inp, width: 90 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>€</span>
              <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.6)', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <button onClick={addCustom} style={{ ...btnSm, marginBottom: 18 }}><Plus size={13} style={{ verticalAlign: '-2px' }} /> Ajouter une ligne sur-mesure</button>

        {/* Note + total */}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note interne (optionnel)" rows={2} style={{ ...inp, width: '100%', resize: 'vertical', marginBottom: 16 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{fmtPrice(total)}</span>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button onClick={save} disabled={saving} style={{
          width: '100%', background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 8, padding: '13px 0',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</> : (editing ? 'Enregistrer et renvoyer au client →' : 'Créer et envoyer la proposition →')}
        </button>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
          {editing
            ? 'Le client recevra le devis mis à jour par email et devra le revalider (l\'ancien brouillon Qonto est remplacé).'
            : 'Le client reçoit un lien par email pour voir sa proposition — sans créer de compte. Son compte ne sera créé que s\'il valide le devis.'}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default function LeadsMariagePage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builder, setBuilder] = useState(null); // { lead, proposal? }
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/mariage-leads')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) setLeads(d.leads || []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEspace = async (proposalId) => {
    if (!window.confirm('Ouvrir l\'espace mariage pour ce client ? À faire une fois l\'acompte reçu.')) return;
    setBusy(proposalId);
    const res = await fetch('/api/admin/open-espace', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId }),
    });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    load();
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Leads mariage</h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 24px' }}>Demandes du formulaire de contact. Rappelez, puis créez la proposition de devis.</p>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Chargement…</p>
      ) : leads.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucun lead pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leads.map(l => (
            <div key={l.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>{l.prenom} {l.nom}</span>
                  {l.proposal
                    ? <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(184,239,11,0.15)', color: 'var(--lime)', fontWeight: 700 }}>Devis {l.proposal.status} · {fmtPrice(l.proposal.total)}</span>
                    : <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>À rappeler</span>}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                  📞 {l.tel} · ✉️ {l.email}<br />
                  📅 {fmtDate(l.event_date)} · 👥 {l.guests || '?'} pers. · 📍 {l.lieu || '—'}
                  {l.message && <><br /><span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>« {l.message} »</span></>}
                </div>
              </div>
              {!l.proposal && (
                <button onClick={() => setBuilder({ lead: l })} style={{
                  border: 'none', background: '#b8ef0b', color: '#060e16', borderRadius: 8, padding: '10px 18px',
                  cursor: 'pointer', fontSize: 13.5, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
                }}><FileText size={15} /> Faire un devis</button>
              )}
              {l.proposal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button onClick={() => setBuilder({ lead: l, proposal: l.proposal })} style={{
                    border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)',
                    borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
                  }}>Modifier le devis</button>
                  {l.proposal.status === 'validee' && !l.proposal.event_id && (
                    <button onClick={() => openEspace(l.proposal.id)} disabled={busy === l.proposal.id} style={{
                      border: 'none', background: '#b8ef0b', color: '#060e16', borderRadius: 8, padding: '9px 16px',
                      cursor: busy === l.proposal.id ? 'wait' : 'pointer', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', opacity: busy === l.proposal.id ? 0.6 : 1,
                    }}><Heart size={14} /> Ouvrir l'espace mariage</button>
                  )}
                  {l.proposal.event_id && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--lime)', fontSize: 13, fontWeight: 600 }}><Check size={16} /> Espace ouvert</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {builder && (
        <DevisBuilder lead={builder.lead} proposal={builder.proposal} onClose={() => setBuilder(null)} onDone={() => { setBuilder(null); load(); }} />
      )}
    </div>
  );
}
