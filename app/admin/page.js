'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '22px 24px',
      border: '1px solid rgba(255,255,255,0.06)', flex: '1 1 180px',
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color: accent || '#fff', margin: '0 0 6px', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 28, textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 28, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(d.count / max) * 100}%`, minWidth: d.count > 0 ? 4 : 0,
              height: '100%', background: 'linear-gradient(90deg, #b8ef0b, #a0d908)',
              borderRadius: 6, transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', width: 16, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdown({ byStatus, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(STATUS).map(([key, s]) => {
        const count = byStatus[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{count} <span style={{ color: 'rgba(255,255,255,0.2)' }}>({pct}%)</span></span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d) {
  if (!d) return null;
  const diff = Math.round((new Date(d + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff < 0) return 'Passé';
  return `J-${diff}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setStats(d); setLoading(false); } });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const ne = stats.nextEvent;
  const nextDateStr = ne ? fmtDate(ne.event_date) : null;
  const countdown = ne ? daysUntil(ne.event_date) : null;

  return (
    <div style={{ padding: '36px 36px 60px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Vue d'ensemble
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cartes stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total devis" value={stats.total} sub={`${stats.thisMonthCount} ce mois`} />
        <StatCard label="Taux de conversion" value={`${stats.conversionRate}%`} sub={`${stats.converted} acceptés ou confirmés`} accent="#b8ef0b" />
        <StatCard label="Clients" value={stats.totalClients} sub="comptes actifs" />
        {ne ? (
          <div style={{
            background: 'rgba(184,239,11,0.06)', borderRadius: 14, padding: '22px 24px',
            border: '1px solid rgba(184,239,11,0.18)', flex: '1 1 180px',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>Prochain événement</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#b8ef0b', margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{countdown}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {ne.clients?.first_name} · {ne.event_type} · {nextDateStr}
            </p>
          </div>
        ) : (
          <StatCard label="Prochain événement" value="—" sub="Aucun à venir" />
        )}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', fontFamily: 'var(--font-display), sans-serif' }}>
            Devis par mois
          </h2>
          <BarChart data={stats.byMonth} />
        </div>
        <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', fontFamily: 'var(--font-display), sans-serif' }}>
            Répartition par statut
          </h2>
          <StatusBreakdown byStatus={stats.byStatus} total={stats.total} />
        </div>
      </div>

      {/* Activité récente */}
      <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>
            Activité récente
          </h2>
          <a href="/admin/devis" style={{ fontSize: 13, color: '#b8ef0b', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stats.recentEvents.map((ev, i) => {
            const st = STATUS[ev.status] || STATUS.devis_envoye;
            return (
              <div
                key={ev.id}
                onClick={() => router.push(`/admin/devis/${ev.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', cursor: 'pointer',
                  borderBottom: i < stats.recentEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.15s', borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `${st.color}18`, color: st.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {ev.clients?.first_name?.[0]}{ev.clients?.last_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.clients?.first_name} {ev.clients?.last_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {ev.event_type || '—'} · {fmtDate(ev.event_date)}
                  </p>
                </div>
                <span style={{
                  background: `${st.color}15`, color: st.color,
                  border: `1px solid ${st.color}35`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>{st.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
