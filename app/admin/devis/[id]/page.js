'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminPlaylistSection from './AdminPlaylistSection';
import AdminGuestSection from './AdminGuestSection';

const STATUSES = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/events/${params.id}`)
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(data => {
        if (data) {
          setEv(data);
          setStatus(data.status);
          setNotes(data.admin_notes || '');
          setClientMessage(data.client_message || '');
          setLoading(false);
        }
      });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/events/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes, client_message: clientMessage }),
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
        <span style={{
          background: `${st.color}18`, color: st.color,
          border: `1px solid ${st.color}50`,
          borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display), sans-serif',
        }}>{st.label}</span>
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
            <InfoRow label="Type" value={ev.event_type} />
            <InfoRow label="Date" value={fmtDate(ev.event_date)} />
            <InfoRow label="Lieu" value={[ev.venue, ev.venue_cp, ev.venue_city].filter(Boolean).join(', ')} />
            <InfoRow label="Invités" value={ev.guests ? `${ev.guests} personnes` : null} />
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

      <AdminGuestSection eventId={params.id} />

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
