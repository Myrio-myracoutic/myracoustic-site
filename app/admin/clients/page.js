'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/events').then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); }),
    ]).then(([events]) => {
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
  }, []);

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Clients</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{filtered.length} client{filtered.length > 1 ? 's' : ''}</p>
        </div>
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
    </div>
  );
}
