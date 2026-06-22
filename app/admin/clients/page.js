'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Search, CheckCircle, FileText, Loader, Mail, RefreshCw, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_QONTO = {
  approved:         { label: 'Signé',      color: '#22c55e' },
  pending_approval: { label: 'En attente', color: '#f59e0b' },
  sent:             { label: 'Envoyé',     color: '#60a5fa' },
  draft:            { label: 'Brouillon',  color: 'rgba(255,255,255,0.3)' },
};

function AccountStatus({ client, onReinvite, reinviting }) {
  const { auth_status, invitation_sent_at } = client;

  if (!client.auth_id) {
    return (
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
        Sans compte
      </span>
    );
  }

  if (auth_status?.confirmed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={13} color="#22c55e" strokeWidth={2} />
        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Compte actif</span>
        {auth_status.lastSignIn && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            · {fmtDate(auth_status.lastSignIn)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={12} color="#f59e0b" strokeWidth={2} />
        <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Invitation envoyée</span>
        {invitation_sent_at && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            · {fmtDate(invitation_sent_at)}
          </span>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onReinvite(client); }}
        disabled={reinviting}
        title="Ré-envoyer l'invitation"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 6, padding: '3px 9px', cursor: 'pointer',
          color: '#60a5fa', fontSize: 11, fontWeight: 600,
          opacity: reinviting ? 0.5 : 1,
        }}
      >
        {reinviting
          ? <Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} />
          : <RefreshCw size={10} />
        }
        {invitation_sent_at ? 'Ré-inviter' : 'Inviter'}
      </button>
    </div>
  );
}

/* ── Modal création compte ─────────────────────────────────────── */
function CreateAccountModal({ onClose, onCreated }) {
  const [profil,      setProfil]     = useState('particulier'); // 'particulier' | 'professionnel'
  const [email,      setEmail]      = useState('');
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quotes,     setQuotes]     = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const searchTimeout = useRef(null);

  const searchQonto = async (val) => {
    if (!val.includes('@')) { setQuotes(null); return; }
    setSearching(true);
    const res  = await fetch(`/api/admin/clients/qonto-search?email=${encodeURIComponent(val)}`);
    const data = await res.json();
    setQuotes(data.quotes || []);
    if (data.clientFound) {
      if (data.firstName)   setFirstName(data.firstName);
      if (data.lastName)    setLastName(data.lastName);
      if (data.phone)       setPhone(data.phone);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.clientType === 'company') setProfil('professionnel');
    }
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
    if (profil === 'professionnel' && !companyName.trim()) { setError("Le nom de l'entreprise est requis."); return; }
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/admin/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, phone: phone || null, companyName: companyName || null, profil, qontoQuoteId: selectedQuote?.id || null }),
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
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '32px 32px 28px', width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>ADRESSE E-MAIL *</label>
              <div style={{ position: 'relative' }}>
                <input type="email" value={email} onChange={e => handleEmailChange(e.target.value)} placeholder="client@email.com"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 36px 10px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  {searching
                    ? <Loader size={14} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Search size={14} color="rgba(255,255,255,0.2)" />}
                </div>
              </div>
            </div>

            {/* Toggle Particulier / Entreprise */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600 }}>TYPE DE CLIENT</label>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: 3 }}>
                {['particulier', 'professionnel'].map(p => (
                  <button key={p} onClick={() => setProfil(p)} style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: profil === p ? '#b8ef0b' : 'transparent',
                    color: profil === p ? '#060e16' : 'rgba(255,255,255,0.45)',
                    fontSize: 12, fontWeight: profil === p ? 700 : 400,
                    fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.15s',
                  }}>
                    {p === 'particulier' ? 'Particulier' : 'Entreprise'}
                  </button>
                ))}
              </div>
            </div>

            {/* Nom de l'entreprise — seulement si professionnel */}
            {profil === 'professionnel' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>NOM DE L'ENTREPRISE *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Société, SARL, SASU…"
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '6px 0 0' }}>
                  Renseignez ensuite le prénom et nom du contact dans l'entreprise.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'PRÉNOM *', value: firstName, set: setFirstName, placeholder: 'Marie' },
                { label: 'NOM *',    value: lastName,  set: setLastName,  placeholder: 'Dupont' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>{label}</label>
                  <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>TÉLÉPHONE</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 68 53 33 08"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            {quotes !== null && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: '0 0 10px' }}>
                  DEVIS QONTO {quotes.length === 0 ? '— aucun trouvé' : `(${quotes.length})`}
                </p>
                {quotes.map(q => {
                  const st = STATUS_QONTO[q.status] || { label: q.status, color: 'rgba(255,255,255,0.3)' };
                  const isSelected = selectedQuote?.id === q.id;
                  const fmt = v => v > 0 ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €' : null;
                  return (
                    <div key={q.id} onClick={() => setSelectedQuote(isSelected ? null : q)}
                      style={{ background: isSelected ? 'rgba(184,239,11,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(184,239,11,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={15} color={isSelected ? '#b8ef0b' : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#b8ef0b' : 'rgba(255,255,255,0.85)' }}>{q.number}</span>
                          {q.header && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>{q.header.slice(0, 55)}</span>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{st.label}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{fmt(q.total)}</div>
                        </div>
                        {isSelected && <CheckCircle size={15} color="#b8ef0b" />}
                      </div>
                    </div>
                  );
                })}
                {quotes.length > 0 && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0', fontStyle: 'italic' }}>
                    Cliquez sur un devis pour le lier (optionnel).
                  </p>
                )}
              </div>
            )}

            {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 16px' }}>{error}</p>}

            <button onClick={handleSubmit} disabled={submitting || !email || !firstName || !lastName}
              style={{ width: '100%', background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 10, padding: '12px 24px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: (submitting || !email || !firstName || !lastName) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting
                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Création en cours…</>
                : <><Mail size={15} /> Créer le compte et envoyer l'invitation</>}
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
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [reinviting, setReinviting] = useState(null); // id du client en cours

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/clients');
    if (res.status === 401) { router.replace('/admin/login'); return; }
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReinvite = async (client) => {
    setReinviting(client.id);
    await fetch(`/api/admin/clients/${client.id}/reinvite`, { method: 'POST' });
    await load();
    setReinviting(null);
  };

  const filtered = clients.filter(c => {
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

  // Compteurs
  const totalActifs    = clients.filter(c => c.auth_status?.confirmed).length;
  const totalAttente   = clients.filter(c => c.auth_id && !c.auth_status?.confirmed).length;

  return (
    <div style={{ padding: '36px 36px 60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Clients</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{clients.length} client{clients.length > 1 ? 's' : ''}</span>
            {totalActifs > 0 && <span style={{ fontSize: 13, color: '#22c55e' }}>· {totalActifs} actif{totalActifs > 1 ? 's' : ''}</span>}
            {totalAttente > 0 && <span style={{ fontSize: 13, color: '#f59e0b' }}>· {totalAttente} en attente d'activation</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 16px', fontSize: 14, color: 'rgba(255,255,255,0.8)', outline: 'none', width: 240 }} />
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14 }}>
            <UserPlus size={16} /> Créer un compte
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0d1b2a', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 2fr', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span>Client</span>
          <span>Email</span>
          <span>Événements</span>
          <span>Statut compte</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
            Aucun client trouvé.
          </div>
        ) : (
          filtered.map((c, i) => {
            const firstEvent = c.events?.[0];
            return (
              <div key={c.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 2fr', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Client */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: firstEvent ? 'pointer' : 'default' }}
                  onClick={() => firstEvent && router.push(`/admin/devis/${firstEvent.id}`)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(184,239,11,0.12)', color: '#b8ef0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div>
                    {c.company_name && (
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#b8ef0b', margin: '0 0 1px', fontFamily: 'var(--font-display)' }}>{c.company_name}</p>
                    )}
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 1px' }}>{c.first_name} {c.last_name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Créé le {fmtDate(c.created_at)}</p>
                  </div>
                </div>

                {/* Email */}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>

                {/* Événements */}
                <span style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                  {c.events?.length || 0} devis
                </span>

                {/* Statut compte */}
                <AccountStatus
                  client={c}
                  onReinvite={handleReinvite}
                  reinviting={reinviting === c.id}
                />
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={() => load()}
        />
      )}
    </div>
  );
}
