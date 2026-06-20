'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

const STATUSES = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Devis accepté', color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',      color: '#22c55e' },
  termine:      { label: 'Terminé',       color: 'rgba(255,255,255,0.3)' },
  annule:       { label: 'Annulé',        color: '#ef4444' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function AdminDevisPage() {
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
      .then(r => {
        if (r.status === 401) { router.replace('/admin/login'); return null; }
        return r.json();
      })
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
    if (res.ok) {
      const updated = await res.json();
      setEv(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const c = ev.clients;
  const st = STATUSES[status] || STATUSES.devis_envoye;

  return (
    <div style={{ minHeight: '100vh', background: '#060e16', fontFamily: 'var(--font-body), sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 70,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto' }} />
          <span style={{
            background: 'rgba(184,239,11,0.1)', color: '#b8ef0b',
            border: '1px solid rgba(184,239,11,0.2)', borderRadius: 6,
            padding: '2px 8px', fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif',
          }}>ADMIN</span>
        </div>
        <button onClick={handleLogout} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.45)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>Déconnexion</button>
      </header>

      <div style={{ paddingTop: 90, maxWidth: 900, margin: '0 auto', padding: '90px 24px 80px' }}>

        {/* Retour */}
        <button onClick={() => router.push('/admin')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>← Retour à la liste</button>

        {/* Titre */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 700,
            color: '#fff', margin: '0 0 8px',
          }}>
            {c?.first_name} {c?.last_name}
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 12 }}>
              {ev.event_type}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Soumis le {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Infos client */}
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '24px 28px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              margin: '0 0 20px',
            }}>Client</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Prénom / Nom" value={`${c?.first_name || ''} ${c?.last_name || ''}`.trim()} />
              <InfoRow label="Email" value={c?.email} />
              <InfoRow label="Téléphone" value={c?.phone} />
              <InfoRow label="Profil" value={c?.profil === 'particulier' ? 'Particulier' : 'Professionnel'} />
            </div>
          </div>

          {/* Infos événement */}
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '24px 28px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              margin: '0 0 20px',
            }}>Événement</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Type" value={ev.event_type} />
              <InfoRow label="Date" value={fmtDate(ev.event_date)} />
              <InfoRow label="Lieu" value={[ev.venue, ev.venue_cp, ev.venue_city].filter(Boolean).join(', ')} />
              <InfoRow label="Invités" value={ev.guests ? `${ev.guests} personnes` : null} />
            </div>
          </div>
        </div>

        {/* Statut + Notes */}
        <div style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '24px 28px', marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
            margin: '0 0 20px',
          }}>Suivi</h2>

          {/* Sélecteur de statut */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, display: 'block', marginBottom: 10 }}>
              Statut actuel
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(STATUSES).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  style={{
                    background: status === key ? `${s.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${status === key ? s.color + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: status === key ? s.color : 'rgba(255,255,255,0.35)',
                    borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif',
                    transition: 'all 0.2s',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Message client */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, display: 'block', marginBottom: 10 }}>
              Message au client
              <span style={{ color: '#b8ef0b', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>visible dans son espace</span>
            </label>
            <textarea
              value={clientMessage}
              onChange={e => setClientMessage(e.target.value)}
              placeholder="Ex : Votre devis a été préparé, pensez à le signer avant le 25 juin…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(184,239,11,0.04)', border: '1px solid rgba(184,239,11,0.15)',
                borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14,
                fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Notes internes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, display: 'block', marginBottom: 10 }}>
              Notes internes
              <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, marginLeft: 8 }}>non visible par le client</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ajouter une note sur ce dossier…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14,
                fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Enregistrer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#b8ef0b', color: '#060e16',
                border: 'none', borderRadius: 8, padding: '10px 24px',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            {saved && (
              <span style={{ color: '#22c55e', fontSize: 13 }}>✓ Enregistré</span>
            )}
          </div>
        </div>

        {/* Lien Qonto */}
        {ev.qonto_quote_url && (
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '20px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Devis Qonto</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>
                Réf. {ev.qonto_quote_id || '—'}
              </div>
            </div>
            <a
              href={ev.qonto_quote_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)',
                borderRadius: 8, padding: '8px 18px', color: '#b8ef0b', fontSize: 13,
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
                textDecoration: 'none',
              }}
            >Ouvrir dans Qonto →</a>
          </div>
        )}
      </div>
    </div>
  );
}
