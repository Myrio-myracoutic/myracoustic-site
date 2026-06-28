'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminPlaylistSection from './AdminPlaylistSection';
import AdminGuestSection from './AdminGuestSection';
import AdminMenuSection from './AdminMenuSection';
import AdminProgrammeSection from './AdminProgrammeSection';
import { Eye } from 'lucide-react';

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

function Card({ title, children }) {
  return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
      {title && <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>{title}</h2>}
      {children}
    </div>
  );
}

export default function AdminDevisDetail() {
  const router = useRouter();
  const params = useParams();
  const [ev,           setEv]          = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [status,       setStatus]      = useState('');
  const [notes,        setNotes]       = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [eventType,    setEventType]   = useState('');
  const [eventDate,    setEventDate]   = useState('');
  const [venue,        setVenue]       = useState('');
  const [venueCP,      setVenueCP]     = useState('');
  const [venueCity,    setVenueCity]   = useState('');
  const [saving,       setSaving]      = useState(false);
  const [saved,        setSaved]       = useState(false);
  const [previewing,   setPreviewing]  = useState(false);

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
        setVenue(data.venue || '');
        setVenueCP(data.venue_cp || '');
        setVenueCity(data.venue_city || '');
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
      body: JSON.stringify({ status, admin_notes: notes, client_message: clientMessage, event_type: eventType || null, event_date: eventDate || null, venue: venue || null, venue_cp: venueCP || null, venue_city: venueCity || null }),
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Retour */}
      <button onClick={() => router.push('/admin/evenements')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        ← Retour aux événements
      </button>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
            {ev.event_type || 'Événement'}
            {ev.event_date && (
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: 12 }}>
                {fmtDate(ev.event_date)}
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {c && (
              <button onClick={() => router.push(`/admin/clients/${c.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#b8ef0b', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                {c.first_name} {c.last_name} →
              </button>
            )}
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
              Soumis le {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handlePreview} disabled={previewing} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display), sans-serif', opacity: previewing ? 0.6 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,239,11,0.1)'; e.currentTarget.style.color = '#b8ef0b'; e.currentTarget.style.borderColor = 'rgba(184,239,11,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <Eye size={14} strokeWidth={1.5} />
            {previewing ? 'Connexion…' : 'Voir l\'espace client'}
          </button>
          <span style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}50`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display), sans-serif' }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Événement */}
      <Card title="Événement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>TYPE D'ÉVÉNEMENT</label>
            <select
              value={EVENT_TYPES.includes(eventType) ? eventType : eventType ? 'Autre' : ''}
              onChange={e => { if (e.target.value === 'Autre') setEventType('Autre'); else setEventType(e.target.value); }}
              style={{ width: '100%', background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
            >
              <option value="" disabled>Sélectionner un type…</option>
              {EVENT_TYPES.map(t => <option key={t} value={t} style={{ background: '#0d1b2a' }}>{t}</option>)}
            </select>
            {eventType && !EVENT_TYPES.slice(0, -1).includes(eventType) && (
              <input value={eventType === 'Autre' ? '' : eventType} onChange={e => setEventType(e.target.value)} autoFocus placeholder="Précisez le type…"
                style={{ marginTop: 8, width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(184,239,11,0.3)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            )}
          </div>
          {/* Date */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>DATE</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: eventDate ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }}
            />
          </div>
          {/* Lieu */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>LIEU</label>
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Nom du lieu ou adresse"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={venueCP} onChange={e => setVenueCP(e.target.value)} placeholder="Code postal"
                style={{ width: 110, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <input value={venueCity} onChange={e => setVenueCity(e.target.value)} placeholder="Ville"
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>
          {ev.guests && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>INVITÉS</span>
              {ev.guests} personnes
            </div>
          )}
        </div>
      </Card>

      {/* Suivi */}
      <div style={{ marginTop: 20 }}>
        <Card title="Suivi">
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10 }}>Statut</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(STATUSES).map(([key, s]) => (
                <button key={key} onClick={() => setStatus(key)} style={{ background: status === key ? `${s.color}18` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${status === key ? s.color + '70' : 'rgba(255,255,255,0.1)'}`, color: status === key ? s.color : 'rgba(255,255,255,0.4)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.15s' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Message au client
              <span style={{ fontSize: 11, background: 'rgba(184,239,11,0.1)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Visible dans son espace</span>
            </label>
            <textarea value={clientMessage} onChange={e => setClientMessage(e.target.value)} placeholder="Ex : Votre devis est prêt…" rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.2)', borderRadius: 8, padding: '11px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
              Notes internes <span style={{ color: 'rgba(255,255,255,0.2)' }}>· non visible par le client</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note interne sur ce dossier…" rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '11px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 9, padding: '10px 28px', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {saved && <span style={{ color: '#b8ef0b', fontSize: 13, fontWeight: 600 }}>✓ Enregistré</span>}
          </div>
        </Card>
      </div>

      <AdminProgrammeSection eventId={params.id} />
      <AdminGuestSection eventId={params.id} />
      <AdminMenuSection eventId={params.id} />
      <AdminPlaylistSection eventId={params.id} />
    </div>
  );
}
