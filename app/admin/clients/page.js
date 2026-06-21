'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Search, CheckCircle, FileText, Loader } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_QONTO = {
  approved:         { label: 'Signé',     color: '#22c55e' },
  pending_approval: { label: 'En attente', color: '#f59e0b' },
  sent:             { label: 'Envoyé',    color: '#60a5fa' },
  draft:            { label: 'Brouillon', color: 'rgba(255,255,255,0.3)' },
};

/* ── Modal création compte ─────────────────────────────────────── */
function CreateAccountModal({ onClose, onCreated }) {
  const [email,     setEmail]     = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [quotes,    setQuotes]    = useState(null);   // null = pas encore cherché
  const [searching, setSearching] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]    = useState('');
  const [success,    setSuccess]  = useState(false);
  const searchTimeout = useRef(null);

  const searchQonto = async (val) => {
    if (!val.includes('@')) { setQuotes(null); return; }
    setSearching(true);
    const res  = await fetch(`/api/admin/clients/qonto-search?email=${encodeURIComponent(val)}`);
    const data = await res.json();
    setQuotes(data.quotes || []);
    setSearching(false);
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    setSelectedQuote(null);
    setQuotes(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchQonto(val), 600);
  };

  const handleSubmit = async () => {
    if (!email || !firstName || !lastName) { setError('Email, prénom et nom sont requis.'); return; }
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/admin/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, phone: phone || null, qontoQuoteId: selectedQuote?.id || null }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error || 'Erreur lors de la création.'); return; }
    setSuccess(true);
    setTimeout(() => { onCreated(); onClose(); }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '32px 32px 28px', width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            Créer un compte client
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={40} color="#22c55e" style={{ marginBottom: 12 }} />
            <p style={{ color: '#fff', fontSize: 15, margin: 0 }}>Compte créé — invitation envoyée !</p>
          </div>
        ) : (
          <>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>
                ADRESSE E-MAIL *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="client@email.com"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                    padding: '10px 36px 10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  {searching
                    ? <Loader size={14} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Search size={14} color="rgba(255,255,255,0.2)" />
                  }
                </div>
              </div>
            </div>

            {/* Prénom + Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'PRÉNOM *', value: firstName, set: setFirstName, placeholder: 'Marie' },
                { label: 'NOM *',    value: lastName,  set: setLastName,  placeholder: 'Dupont' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>{label}</label>
                  <input
                    type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                      padding: '10px 14px', color: '#fff', fontSize: 14,
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Téléphone */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>
                TÉLÉPHONE
              </label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 68 53 33 08"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                  padding: '10px 14px', color: '#fff', fontSize: 14,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Devis Qonto trouvés */}
            {quotes !== null && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: '0 0 10px' }}>
                  DEVIS QONTO TROUVÉS {quotes.length === 0 ? '— aucun' : `(${quotes.length})`}
                </p>
                {quotes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quotes.map(q => {
                      const st = STATUS_QONTO[q.status] || { label: q.status, color: 'rgba(255,255,255,0.3)' };
                      const isSelected = selectedQuote?.id === q.id;
                      return (
                        <div
                          key={q.id}
                          onClick={() => setSelectedQuote(isSelected ? null : q)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: isSelected ? 'rgba(184,239,11,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isSelected ? 'rgba(184,239,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <FileText size={16} color={isSelected ? '#b8ef0b' : 'rgba(255,255,255,0.3)'} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#b8ef0b' : 'rgba(255,255,255,0.8)' }}>
                              {q.number}
                            </span>
                            {q.header && (
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                                {q.header.slice(0, 60)}
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{st.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                              {q.amount ? `${parseFloat(q.amount).toLocaleString('fr-FR')} €` : ''}
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={16} color="#b8ef0b" style={{ flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0', fontStyle: 'italic' }}>
                      Cliquez sur un devis pour le lier au compte (optionnel).
                    </p>
                  </div>
                )}
                {quotes.length === 0 && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0 }}>
                    Aucun devis trouvé dans Qonto pour cet email.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !email || !firstName || !lastName}
              style={{
                width: '100%', background: '#b8ef0b', color: '#060e16',
                border: 'none', borderRadius: 10, padding: '12px 24px',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 800,
                fontSize: 14, cursor: 'pointer', transition: 'opacity 0.15s',
                opacity: (submitting || !email || !firstName || !lastName) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting
                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Création en cours…</>
                : 'Créer le compte et envoyer l\'invitation'
              }
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Page clients ──────────────────────────────────────────────── */
export default function AdminClientsPage() {
  const router = useRouter();
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showModal,   setShowModal]   = useState(false);

  const load = () => {
    fetch('/api/admin/events').then(r => {
      if (r.status === 401) { router.replace('/admin/login'); return null; }
      return r.json();
    }).then(events => {
      if (!events) return;
      const map = {};
      events.forEach(ev => {
        const c = ev.clients;
        if (!c) return;
        if (!map[c.id]) map[c.id] = { ...c, events: [] };
        map[c.id].events.push(ev);
      });
      setData(Object.values(map).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = (data || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '36px 36px 60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Clients</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{filtered.length} client{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '9px 16px', fontSize: 14, color: 'rgba(255,255,255,0.8)',
              outline: 'none', width: 240,
            }}
          />
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#b8ef0b', color: '#060e16', border: 'none',
              borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
            }}
          >
            <UserPlus size={16} /> Créer un compte
          </button>
        </div>
      </div>

      <div style={{ background: '#0d1b2a', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.03)',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span>Client</span>
          <span>Email</span>
          <span>Téléphone</span>
          <span>Devis</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
            Aucun client trouvé.
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => { const ev = c.events?.[0]; if (ev) router.push(`/admin/devis/${ev.id}`); }}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                padding: '14px 20px', cursor: 'pointer', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(184,239,11,0.12)', color: '#b8ef0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 1px' }}>{c.first_name} {c.last_name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Client depuis {fmtDate(c.created_at)}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{c.email}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{c.phone || '—'}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)',
                  borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                }}>{c.events.length} devis</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setLoading(true); load(); }}
        />
      )}
    </div>
  );
}
