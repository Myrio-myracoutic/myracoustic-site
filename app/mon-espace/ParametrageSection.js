'use client';
import { useEffect, useState, useCallback } from 'react';
import { UserCircle, CreditCard, Users, Plus, Trash2, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const TABS = [
  { id: 'compte',    label: 'Mon compte',      icon: UserCircle },
  { id: 'facturation', label: 'Facturation',   icon: CreditCard },
  { id: 'acces',     label: 'Accès partagés',  icon: Users },
];

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  padding: '10px 14px', color: '#fff', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

/* ── Onglet Mon compte ─────────────────────────────────────────── */
function TabCompte({ token, eventId }) {
  const [form,    setForm]    = useState({ firstName: '', lastName: '', phone: '' });
  const [email,   setEmail]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mon-espace/settings?eventId=${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      setForm({ firstName: d.account?.first_name || '', lastName: d.account?.last_name || '', phone: d.account?.phone || '' });
      setEmail(d.account?.email || '');
      setLoading(false);
    });
  }, [token, eventId]);

  const save = async () => {
    setSaving(true);
    await fetch('/api/mon-espace/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: form.phone, eventId }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>PRÉNOM</label>
          <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Marie" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>NOM</label>
          <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
          ADRESSE E-MAIL <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>· non modifiable</span>
        </label>
        <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={email} readOnly />
      </div>
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>TÉLÉPHONE</label>
        <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07 68 53 33 08" type="tel" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={saving} style={{
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 9,
          padding: '10px 28px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        {saved && <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✓ Mis à jour</span>}
      </div>
    </div>
  );
}

/* ── Onglet Facturation ────────────────────────────────────────── */
function TabFacturation({ token, eventId }) {
  const [billingEmail, setBillingEmail] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetch(`/api/mon-espace/settings?eventId=${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { setBillingEmail(d.billingEmail || ''); setLoading(false); });
  }, [token, eventId]);

  const save = async () => {
    setSaving(true);
    await fetch('/api/mon-espace/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ billingEmail, eventId }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{
        background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.15)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
      }}>
        Si la personne qui règle les factures est différente de celle qui gère l'événement, renseignez son adresse e-mail ici.
        Elle recevra les rappels et liens de paiement à la place de votre adresse principale.
      </div>
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
          E-MAIL DE FACTURATION <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>· optionnel</span>
        </label>
        <input
          type="email"
          style={inputStyle}
          value={billingEmail}
          onChange={e => setBillingEmail(e.target.value)}
          placeholder="comptabilite@entreprise.fr"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={saving} style={{
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 9,
          padding: '10px 28px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        {saved && <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✓ Mis à jour</span>}
        {billingEmail && (
          <button onClick={() => { setBillingEmail(''); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12,
          }}>Supprimer</button>
        )}
      </div>
    </div>
  );
}

/* ── Onglet Accès partagés ─────────────────────────────────────── */
function TabAcces({ token, eventId, isOwner }) {
  const [collabs,   setCollabs]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ firstName: '', lastName: '', email: '' });
  const [inviting,  setInviting]  = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    const res  = await fetch(`/api/mon-espace/collaborateurs?eventId=${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCollabs(data.collaborateurs || []);
    setLoading(false);
  }, [token, eventId]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!form.firstName.trim() || !form.email.trim()) { setError('Prénom et e-mail requis.'); return; }
    setInviting(true); setError('');
    const res = await fetch('/api/mon-espace/collaborateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId, email: form.email, firstName: form.firstName, lastName: form.lastName }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setError(data.error || 'Erreur'); return; }
    setForm({ firstName: '', lastName: '', email: '' });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Retirer cet accès ?')) return;
    setDeleting(id);
    await fetch(`/api/mon-espace/collaborateurs/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(null);
    load();
  };

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, margin: '0 0 20px' }}>
        Invitez des personnes à co-gérer cet événement. Elles auront accès à l'ensemble de l'espace client.
      </p>

      {/* Liste */}
      {collabs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {collabs.map(c => {
            const accepted = !!c.accepted_at;
            return (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: accepted ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {accepted
                    ? <CheckCircle size={16} color="#22c55e" />
                    : <Clock size={16} color="#f59e0b" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {c.first_name} {c.last_name || ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {c.email} · {accepted ? 'Accès actif' : 'Invitation envoyée'}
                  </div>
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => invite_resend(c)}
                      title="Ré-envoyer l'invitation"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      disabled={deleting === c.id}
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: '#ef4444', opacity: deleting === c.id ? 0.5 : 1 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {collabs.length === 0 && !showForm && (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>
          Aucun collaborateur pour l'instant.
        </p>
      )}

      {/* Formulaire d'invitation */}
      {isOwner && !showForm && (
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 9,
          padding: '10px 20px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 13, cursor: 'pointer',
        }}>
          <Plus size={15} /> Inviter un collaborateur
        </button>
      )}

      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '18px 20px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 5 }}>PRÉNOM *</label>
              <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Marie" autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 5 }}>NOM</label>
              <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 5 }}>ADRESSE E-MAIL *</label>
            <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="collaborateur@email.com" />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={invite} disabled={inviting} style={{
              background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 8,
              padding: '9px 22px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
            }}>{inviting ? 'Envoi…' : 'Envoyer l\'invitation'}</button>
            <button onClick={() => { setShowForm(false); setError(''); setForm({ firstName: '', lastName: '', email: '' }); }} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '9px 16px', color: 'rgba(255,255,255,0.5)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );

  // Ré-envoyer l'invitation (réutilise le POST)
  async function invite_resend(collab) {
    await fetch('/api/mon-espace/collaborateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId, email: collab.email, firstName: collab.first_name, lastName: collab.last_name }),
    });
  }
}

/* ── Section principale ────────────────────────────────────────── */
export default function ParametrageSection({ ev, token, isOwner = true, isPro = false }) {
  const [tab, setTab] = useState('compte');

  const visibleTabs = TABS.filter(t => {
    if (t.id === 'facturation' && !isPro) return false; // réservé aux entreprises
    if (t.id === 'acces' && !isOwner) return false;     // réservé au responsable
    return true;
  });

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {visibleTabs.map(t => {
          const isAct = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: isAct ? 700 : 400,
              color: isAct ? '#b8ef0b' : 'rgba(255,255,255,0.4)',
              borderBottom: isAct ? '2px solid #b8ef0b' : '2px solid transparent',
              fontFamily: 'var(--font-display), sans-serif',
            }}>
              <t.icon size={14} strokeWidth={isAct ? 2.2 : 1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'compte'      && <TabCompte      token={token} eventId={ev?.id} />}
      {tab === 'facturation' && <TabFacturation token={token} eventId={ev?.id} />}
      {tab === 'acces'       && <TabAcces       token={token} eventId={ev?.id} isOwner={isOwner} />}
    </div>
  );
}
