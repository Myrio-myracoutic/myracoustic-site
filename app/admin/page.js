'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STATUSES = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Devis accepté', color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',      color: '#22c55e' },
  termine:      { label: 'Terminé',       color: 'rgba(255,255,255,0.3)' },
  annule:       { label: 'Annulé',        color: '#ef4444' },
};

const FILTERS = [
  { key: 'all',          label: 'Tous' },
  { key: 'devis_envoye', label: 'En attente' },
  { key: 'accepte',      label: 'Acceptés' },
  { key: 'confirme',     label: 'Confirmés' },
  { key: 'termine',      label: 'Terminés' },
  { key: 'annule',       label: 'Annulés' },
];

function StatusBadge({ status }) {
  const st = STATUSES[status] || STATUSES.devis_envoye;
  return (
    <span style={{
      background: `${st.color}18`, color: st.color,
      border: `1px solid ${st.color}40`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-display), sans-serif', whiteSpace: 'nowrap',
    }}>{st.label}</span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => {
        if (r.status === 401) { router.replace('/admin/login'); return null; }
        return r.json();
      })
      .then(data => { if (data) { setEvents(data); setLoading(false); } });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  const counts = Object.keys(STATUSES).reduce((acc, k) => {
    acc[k] = events.filter(e => e.status === k).length;
    return acc;
  }, {});

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

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

      <div style={{ paddingTop: 90, maxWidth: 1100, margin: '0 auto', padding: '90px 24px 80px' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { label: 'Total', value: events.length, color: '#fff' },
            { label: 'En attente', value: counts.devis_envoye, color: '#f59e0b' },
            { label: 'Confirmés', value: counts.confirme, color: '#22c55e' },
            { label: 'Terminés', value: counts.termine, color: 'rgba(255,255,255,0.3)' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '16px 24px', minWidth: 120,
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display), sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === f.key ? 'rgba(184,239,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f.key ? '#b8ef0b' : 'rgba(255,255,255,0.45)',
              borderRadius: 20, padding: '6px 14px', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              {f.label}{f.key !== 'all' && counts[f.key] ? ` (${counts[f.key]})` : ''}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '40px 32px', textAlign: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>Aucun devis dans cette catégorie.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(ev => {
              const c = ev.clients;
              return (
                <div
                  key={ev.id}
                  onClick={() => router.push(`/admin/devis/${ev.id}`)}
                  style={{
                    background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: '18px 24px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,239,11,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                >
                  {/* Client */}
                  <div style={{ minWidth: 180, flex: '1 1 180px' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>
                      {c?.first_name} {c?.last_name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                      {c?.email}
                    </div>
                  </div>

                  {/* Événement */}
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{ev.event_type || '—'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                      {fmtDate(ev.event_date)}{ev.venue_city ? ` · ${ev.venue_city}` : ''}
                      {ev.guests ? ` · ${ev.guests} pers.` : ''}
                    </div>
                  </div>

                  {/* Statut */}
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={ev.status} />
                  </div>

                  {/* Date de soumission */}
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, flexShrink: 0 }}>
                    {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, flexShrink: 0 }}>→</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
