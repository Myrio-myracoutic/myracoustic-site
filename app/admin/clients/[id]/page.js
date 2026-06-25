'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ChevronRight, Users, FileText, ExternalLink, ShieldCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import AdminCollaborateursSection from '@/app/admin/evenements/[id]/AdminCollaborateursSection';

const STATUS_EV = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

const STATUS_INV = {
  paid:    { label: 'Payée',     color: '#22c55e' },
  unpaid:  { label: 'Impayée',   color: '#ef4444' },
  pending: { label: 'En attente', color: '#f59e0b' },
};

function fmtDate(d) {
  if (!d) return '—';
  // Si c'est déjà un timestamp ISO complet, on ne rajoute pas T12:00:00
  const date = d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtMoney(v) {
  if (!v && v !== 0) return '—';
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

function inputStyle(extra = {}) {
  return {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', ...extra,
  };
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '24px 28px', marginTop: 20 }}>
      {title && (
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default function AdminClientDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [client,    setClient]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [qonto,     setQonto]     = useState(null);
  const [qLoading,  setQLoading]  = useState(false);

  // Champs éditables
  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [phone,         setPhone]         = useState('');
  const [profil,        setProfil]        = useState('particulier');
  const [companyName,   setCompanyName]   = useState('');
  const [siret,         setSiret]         = useState('');
  const [adresse,       setAdresse]       = useState('');
  const [cp,            setCp]            = useState('');
  const [ville,         setVille]         = useState('');
  const [billingEmail,  setBillingEmail]  = useState('');

  const load = useCallback(async () => {
    const res  = await fetch(`/api/admin/clients/${id}`);
    if (res.status === 401) { router.replace('/admin/login'); return; }
    const data = await res.json();
    setClient(data);
    setFirstName(data.first_name || '');
    setLastName(data.last_name || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setProfil(data.profil || 'particulier');
    setCompanyName(data.company_name || '');
    setSiret(data.siret || '');
    setAdresse(data.adresse || '');
    setCp(data.cp || '');
    setVille(data.ville || '');
    setBillingEmail(data.billing_email || '');
    setLoading(false);

    // Charger les données Qonto
    if (data.email) {
      setQLoading(true);
      const qRes  = await fetch(`/api/admin/clients/qonto-search?email=${encodeURIComponent(data.email)}`);
      const qData = await qRes.json();
      setQonto(qData.clientFound ? qData : null);
      setQLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone, profil, company_name: companyName, siret, adresse, cp, ville, billing_email: billingEmail }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const events = (client?.events || []).sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''));

  return (
    <div style={{ padding: '36px 36px 80px', maxWidth: 980, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Retour */}
      <button onClick={() => router.push('/admin/clients')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        ← Retour aux clients
      </button>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(184,239,11,0.12)', color: '#b8ef0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {firstName?.[0]}{lastName?.[0]}
        </div>
        <div>
          {companyName && <p style={{ fontSize: 12, color: '#b8ef0b', fontWeight: 700, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>{companyName}</p>}
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
            {firstName} {lastName}
          </h1>
        </div>
        {client?.auth_status?.confirmed ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 10px' }}>
            <ShieldCheck size={12} /> Compte actif
          </span>
        ) : client?.auth_id ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '3px 10px' }}>
            <Clock size={12} /> En attente d'activation
          </span>
        ) : null}
      </div>
      {client?.auth_status?.lastSignIn && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0 64px' }}>
          Dernière connexion : {fmtDateTime(client.auth_status.lastSignIn)}
        </p>
      )}

      {/* ── Informations client ──────────────────────────────── */}
      <SectionCard title="Informations client">
        {/* Toggle profil */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, fontWeight: 600 }}>TYPE DE CLIENT</label>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: 3, maxWidth: 260 }}>
            {['particulier', 'professionnel'].map(p => (
              <button key={p} onClick={() => setProfil(p)} style={{
                flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {profil === 'professionnel' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>NOM DE L'ENTREPRISE</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Société, SARL…" style={inputStyle()} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>PRÉNOM</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>NOM</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>TÉLÉPHONE</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle()} />
          </div>
        </div>

        {/* Facturation */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 18, paddingTop: 18 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Informations de facturation</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>ADRESSE</label>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="10 rue des Lilas" style={inputStyle()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>CODE POSTAL</label>
              <input value={cp} onChange={e => setCp(e.target.value)} placeholder="44000" style={inputStyle()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>VILLE</label>
              <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Nantes" style={inputStyle()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>EMAIL FACTURATION</label>
              <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="compta@entreprise.fr" style={inputStyle()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5, fontWeight: 600 }}>SIRET</label>
              <input value={siret} onChange={e => setSiret(e.target.value)} placeholder="000 000 000 00000" style={inputStyle()} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 9,
            padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
            opacity: saving ? 0.7 : 1,
          }}>
            <Save size={14} />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {saved && <span style={{ color: '#b8ef0b', fontSize: 13, fontWeight: 600 }}>✓ Enregistré</span>}
        </div>
      </SectionCard>

      {/* ── Événements ──────────────────────────────────────── */}
      <SectionCard title={`Événements (${events.length})`}>
        {events.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Aucun événement pour ce client.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(ev => {
              const st = STATUS_EV[ev.status] || STATUS_EV.devis_envoye;
              return (
                <div
                  key={ev.id}
                  onClick={() => router.push(`/admin/evenements/${ev.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 3px' }}>
                      {ev.event_type || 'Événement sans type'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                      {fmtDate(ev.event_date)}
                      {ev.venue_city && ` · ${ev.venue_city}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {st.label}
                    </span>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Accès partagé par événement ──────────────────── */}
      {events.length > 0 && (
        <SectionCard title="Accès partagé">
          {events.map(ev => (
            <div key={ev.id} style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={12} /> {ev.event_type || 'Événement'} · {fmtDate(ev.event_date)}
              </p>
              <AdminCollaborateursSection eventId={ev.id} compact />
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── Facturation Qonto ───────────────────────────── */}
      <SectionCard title="Facturation">
        {qLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Chargement des données Qonto…
          </div>
        ) : !qonto ? (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
            Aucun dossier Qonto trouvé pour {email}.
          </p>
        ) : qonto.quotes.length === 0 && !qonto.standaloneInvoices?.length ? (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
            Aucune facturation Qonto pour ce client.
          </p>
        ) : (
          <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {qonto.quotes.map(q => (
              <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
                {/* En-tête devis */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: q.invoices?.length ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={14} color="rgba(184,239,11,0.6)" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{q.number}</p>
                      {q.header && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{q.header.slice(0, 60)}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#b8ef0b', margin: '0 0 2px' }}>{fmtMoney(q.total)}</p>
                      {q.remaining > 0 && q.remaining < q.total && (
                        <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>Reste : {fmtMoney(q.remaining)}</p>
                      )}
                    </div>
                    {q.quote_url && (
                      <a href={q.quote_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 7, padding: '5px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 12,
                        textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
                      }}>
                        <ExternalLink size={12} /> Voir devis
                      </a>
                    )}
                  </div>
                </div>

                {/* Factures liées */}
                {q.invoices?.length > 0 && (
                  <div style={{ padding: '8px 16px 12px' }}>
                    {q.invoices.map((inv, i) => {
                      const ist = STATUS_INV[inv.status] || { label: inv.status, color: 'rgba(255,255,255,0.3)' };
                      const typeLabel = inv.type === 'deposit' ? 'Acompte' : inv.type === 'final' ? 'Solde' : inv.type === 'credit_note' ? 'Avoir' : 'Facture';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < q.invoices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 60, flexShrink: 0 }}>{typeLabel}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', minWidth: 110 }}>{inv.number}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{fmtMoney(inv.amount)}</span>
                          <span style={{ background: `${ist.color}18`, color: ist.color, border: `1px solid ${ist.color}35`, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                            {ist.label}
                          </span>
                          {/* Échéance — uniquement si non payée */}
                          {inv.status !== 'paid' && inv.due_date && (
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: new Date(inv.due_date) < new Date() ? '#ef4444' : '#f59e0b',
                            }}>
                              Échéance : {fmtDate(inv.due_date)}
                              {new Date(inv.due_date) < new Date() ? ' ⚠' : ''}
                            </span>
                          )}
                          {inv.status === 'paid' && inv.paid_at && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Payée le {fmtDate(inv.paid_at)}</span>
                          )}
                          {inv.invoice_url && (
                            <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecoration: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#b8ef0b'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                            >
                              <ExternalLink size={11} /> Voir
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          </>
        )}
      </SectionCard>
    </div>
  );
}
