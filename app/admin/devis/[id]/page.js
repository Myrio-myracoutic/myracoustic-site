'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminPlaylistSection from './AdminPlaylistSection';
import AdminGuestSection from './AdminGuestSection';
import AdminProgrammeSection from './AdminProgrammeSection';
import AdminCollaborateursSection from './AdminCollaborateursSection';
import { Eye, Link2, X, FileText, CheckCircle, Loader } from 'lucide-react';

const STATUS_QONTO = {
  approved:         { label: 'Signé',      color: '#22c55e' },
  pending_approval: { label: 'En attente', color: '#f59e0b' },
  sent:             { label: 'Envoyé',     color: '#60a5fa' },
  draft:            { label: 'Brouillon',  color: 'rgba(255,255,255,0.3)' },
};

function LinkQuoteModal({ clientEmail, eventId, currentQuoteId, onClose, onLinked }) {
  const [quotes,        setQuotes]        = useState(null);
  const [searching,     setSearching]     = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [linking,       setLinking]       = useState(false);
  const [success,       setSuccess]       = useState(false);

  useEffect(() => {
    if (!clientEmail) return;
    setSearching(true);
    fetch(`/api/admin/clients/qonto-search?email=${encodeURIComponent(clientEmail)}`)
      .then(r => r.json())
      .then(data => { setQuotes(data.quotes || []); setSearching(false); });
  }, [clientEmail]);

  const handleLink = async () => {
    if (!selectedQuote) return;
    setLinking(true);
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qonto_quote_id:  selectedQuote.id,
        qonto_quote_url: selectedQuote.quote_url,
      }),
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { onLinked(selectedQuote); onClose(); }, 1200);
    }
    setLinking(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 540,
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
            Lier un devis Qonto
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={36} color="#22c55e" style={{ marginBottom: 10 }} />
            <p style={{ color: '#fff', fontSize: 14, margin: 0 }}>Devis lié avec succès !</p>
          </div>
        ) : searching ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            <Loader size={20} style={{ animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Recherche des devis Qonto…</p>
          </div>
        ) : !quotes?.length ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
            Aucun devis trouvé pour {clientEmail}
          </p>
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 14px' }}>
              {quotes.length} devis trouvé{quotes.length > 1 ? 's' : ''} pour {clientEmail}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {quotes.map(q => {
                const st = STATUS_QONTO[q.status] || { label: q.status, color: 'rgba(255,255,255,0.3)' };
                const isSel = selectedQuote?.id === q.id;
                const isCurrent = q.id === currentQuoteId;
                const fmt = v => v > 0 ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €' : null;
                return (
                  <div
                    key={q.id}
                    onClick={() => !isCurrent && setSelectedQuote(isSel ? null : q)}
                    style={{
                      background: isSel ? 'rgba(184,239,11,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? 'rgba(184,239,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, padding: '12px 14px',
                      cursor: isCurrent ? 'default' : 'pointer',
                      opacity: isCurrent ? 0.4 : 1, transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={14} color={isSel ? '#b8ef0b' : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isSel ? '#b8ef0b' : 'rgba(255,255,255,0.85)' }}>
                          {q.number}
                        </span>
                        {q.header && (
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                            {q.header.slice(0, 50)}
                          </span>
                        )}
                        {isCurrent && (
                          <span style={{ fontSize: 11, color: '#b8ef0b', marginLeft: 8 }}>· déjà lié</span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{st.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{fmt(q.total)}</div>
                      </div>
                      {isSel && <CheckCircle size={14} color="#b8ef0b" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleLink}
              disabled={!selectedQuote || linking}
              style={{
                width: '100%', background: selectedQuote ? '#b8ef0b' : 'rgba(255,255,255,0.08)',
                color: selectedQuote ? '#060e16' : 'rgba(255,255,255,0.3)',
                border: 'none', borderRadius: 9, padding: '11px 24px',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
                cursor: selectedQuote ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {linking
                ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Liaison…</>
                : selectedQuote ? `Lier ${selectedQuote.number}` : 'Sélectionnez un devis'
              }
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const STATUSES = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

const EVENT_TYPES = [
  'Mariage', 'PACS', 'Anniversaire', 'EVJF/EVG',
  'Bat/Bar-Mitzvah', 'Communion', 'Fête familiale',
  'Soirée privée', 'Soirée d\'entreprise', 'Séminaire', 'Gala',
  'Autre',
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{value}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '24px 28px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {title && <h2 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px',
      }}>{title}</h2>}
      {children}
    </div>
  );
}

export default function AdminDevisDetail() {
  const router = useRouter();
  const params = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const reload = () => fetch(`/api/admin/events/${params.id}`)
    .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
    .then(data => {
      if (data) {
        setEv(data);
        setStatus(data.status);
        setNotes(data.admin_notes || '');
        setClientMessage(data.client_message || '');
        setEventType(data.event_type || '');
        setEventDate(data.event_date || '');
        setLoading(false);
      }
    });

  useEffect(() => { reload(); }, [params.id]);

  const handlePreview = async () => {
    setPreviewing(true);
    const res = await fetch(`/api/admin/events/${params.id}/preview`, { method: 'POST' });
    const data = await res.json();
    setPreviewing(false);
    if (data.url) window.open(data.url, '_blank');
    else alert(data.error || 'Impossible de générer le lien.');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/events/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes, client_message: clientMessage, event_type: eventType || null, event_date: eventDate || null }),
    });
    if (res.ok) { setEv(await res.json()); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const c = ev.clients;
  const st = STATUSES[status] || STATUSES.devis_envoye;

  return (
    <div style={{ padding: '36px 36px 60px', maxWidth: 980, margin: '0 auto' }}>

      {/* Retour + titre */}
      <button onClick={() => router.push('/admin/devis')} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
        fontSize: 13, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'inherit',
      }}>← Retour aux devis</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
            {c?.first_name} {c?.last_name}
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 10 }}>{ev.event_type}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Soumis le {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handlePreview}
            disabled={previewing}
            title="Ouvrir l'espace client dans un nouvel onglet"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9, padding: '7px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-display), sans-serif',
              opacity: previewing ? 0.6 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,239,11,0.1)'; e.currentTarget.style.color = '#b8ef0b'; e.currentTarget.style.borderColor = 'rgba(184,239,11,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <Eye size={14} strokeWidth={1.5} />
            {previewing ? 'Connexion…' : 'Voir l\'espace client'}
          </button>
          <span style={{
            background: `${st.color}18`, color: st.color,
            border: `1px solid ${st.color}50`,
            borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-display), sans-serif',
          }}>{st.label}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
        <Card title="Client">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InfoRow label="Prénom / Nom" value={`${c?.first_name || ''} ${c?.last_name || ''}`.trim()} />
            <InfoRow label="Email" value={c?.email} />
            <InfoRow label="Téléphone" value={c?.phone} />
            <InfoRow label="Profil" value={c?.profil === 'particulier' ? 'Particulier' : 'Professionnel'} />
          </div>
        </Card>
        <Card title="Événement">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Type — sélecteur */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>TYPE D'ÉVÉNEMENT</label>
              <select
                value={EVENT_TYPES.includes(eventType) ? eventType : eventType ? 'Autre' : ''}
                onChange={e => {
                  if (e.target.value === 'Autre') setEventType('Autre');
                  else setEventType(e.target.value);
                }}
                style={{
                  width: '100%', background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                }}
              >
                <option value="" disabled>Sélectionner un type…</option>
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: '#0d1b2a' }}>{t}</option>
                ))}
              </select>
              {/* Champ personnalisé si "Autre" sélectionné et pas dans la liste */}
              {eventType && !EVENT_TYPES.slice(0, -1).includes(eventType) && (
                <input
                  value={eventType === 'Autre' ? '' : eventType}
                  onChange={e => setEventType(e.target.value)}
                  autoFocus
                  placeholder="Précisez le type d'événement…"
                  style={{
                    marginTop: 8, width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(184,239,11,0.3)', borderRadius: 7,
                    padding: '8px 12px', color: '#fff', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
            {/* Date — éditable */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>DATE</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7, padding: '8px 12px', color: eventDate ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: 13, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
                }}
              />
            </div>
            <InfoRow label="Lieu" value={[ev.venue, ev.venue_cp, ev.venue_city].filter(Boolean).join(', ')} />
            <InfoRow label="Invités" value={ev.guests ? `${ev.guests} personnes` : null} />
            {/* Lier devis Qonto */}
            <div style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>DEVIS QONTO</div>
                  <div style={{ fontSize: 13, color: ev.qonto_quote_id ? '#b8ef0b' : 'rgba(255,255,255,0.25)' }}>
                    {ev.qonto_quote_id ? `DEV lié · ${ev.qonto_quote_id.slice(0, 8)}…` : 'Aucun devis lié'}
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600,
                    fontFamily: 'var(--font-display), sans-serif',
                  }}
                >
                  <Link2 size={13} />
                  {ev.qonto_quote_id ? 'Changer' : 'Lier un devis'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Suivi">
        {/* Statut */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10 }}>Statut</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(STATUSES).map(([key, s]) => (
              <button key={key} onClick={() => setStatus(key)} style={{
                background: status === key ? `${s.color}18` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${status === key ? s.color + '70' : 'rgba(255,255,255,0.1)'}`,
                color: status === key ? s.color : 'rgba(255,255,255,0.4)',
                borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.15s',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Message client */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            Message au client
            <span style={{ fontSize: 11, background: 'rgba(184,239,11,0.1)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
              Visible dans son espace
            </span>
          </label>
          <textarea value={clientMessage} onChange={e => setClientMessage(e.target.value)}
            placeholder="Ex : Votre devis est prêt, pensez à le signer avant le 25 juin…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.2)',
              borderRadius: 8, padding: '11px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 14,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
        </div>

        {/* Notes internes */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
            Notes internes <span style={{ color: 'rgba(255,255,255,0.2)' }}>· non visible par le client</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Note interne sur ce dossier…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 8, padding: '11px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 14,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={handleSave} disabled={saving} style={{
            background: '#b8ef0b', color: '#060e16',
            border: 'none', borderRadius: 9, padding: '10px 28px',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          {saved && <span style={{ color: '#b8ef0b', fontSize: 13, fontWeight: 600 }}>✓ Enregistré</span>}
        </div>
      </Card>

      {showLinkModal && (
        <LinkQuoteModal
          clientEmail={c?.email}
          eventId={params.id}
          currentQuoteId={ev.qonto_quote_id}
          onClose={() => setShowLinkModal(false)}
          onLinked={() => { setShowLinkModal(false); reload(); }}
        />
      )}

      <AdminProgrammeSection eventId={params.id} />

      <AdminCollaborateursSection eventId={params.id} />

      <AdminGuestSection eventId={params.id} />

      {/* Aperçus des emails */}
      <div style={{
        marginTop: 20, background: '#0d1b2a', borderRadius: 14, padding: '18px 24px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em',
          margin: '0 0 14px',
        }}>Aperçu des emails</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { type: 'devis_envoye', label: 'Devis envoyé' },
            { type: 'accepte',      label: 'Devis signé' },
            { type: 'confirme',     label: 'Réservation confirmée' },
            { type: 'payment-reminder', label: 'Rappel paiement solde' },
            { type: 'termine',      label: 'Terminé' },
            { type: 'annule',       label: 'Annulation' },
          ].map(({ type, label }) => (
            <a
              key={type}
              href={`/api/admin/preview/email/${type}?eventId=${params.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
                fontFamily: 'var(--font-display), sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(184,239,11,0.4)'; e.currentTarget.style.color = '#b8ef0b'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <AdminPlaylistSection eventId={params.id} />

      {ev.qonto_quote_url && (
        <div style={{
          marginTop: 20, background: '#0d1b2a', borderRadius: 14, padding: '18px 24px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px' }}>Devis Qonto</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Réf. {ev.qonto_quote_id || '—'}</p>
          </div>
          <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
            background: '#b8ef0b', color: '#060e16', borderRadius: 9, padding: '9px 20px',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13,
            textDecoration: 'none',
          }}>Ouvrir dans Qonto →</a>
        </div>
      )}
    </div>
  );
}
