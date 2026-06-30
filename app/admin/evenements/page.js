'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

const STATUS = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

const FILTERS = [
  { key: 'all',          label: 'Tous' },
  { key: 'devis_envoye', label: 'En attente' },
  { key: 'accepte',      label: 'Acceptés' },
  { key: 'confirme',     label: 'Confirmés' },
  { key: 'termine',      label: 'Terminés' },
  { key: 'annule',       label: 'Annulés' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}


export default function AdminDevisPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search,     setSearch]     = useState('');
  const [sortDate,   setSortDate]   = useState('asc');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setEvents(d); setLoading(false); } });
  }, []);

  const handleDelete = async (e, ev) => {
    e.stopPropagation();
    const label = ev.clients?.first_name ? `${ev.clients.first_name} ${ev.clients.last_name || ''}`.trim() : (ev.event_type || 'cet événement');
    if (!confirm(`Supprimer définitivement l'événement de ${label} ? Toutes les données associées (invités, playlists, programme…) seront perdues. Cette action est irréversible.`)) return;
    setDeletingId(ev.id);
    const res = await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) setEvents(prev => prev.filter(x => x.id !== ev.id));
    else { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur lors de la suppression.'); }
  };

  const today     = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const filtered = events
    .filter(e => filter === 'all' || e.status === filter)
    .filter(e => {
      if (dateFilter === 'all')    return true;
      if (dateFilter === 'avenir') return e.event_date && e.event_date >= today;
      if (dateFilter === 'mois')   return e.event_date && e.event_date.startsWith(thisMonth);
      if (dateFilter === 'passes') return !e.event_date || e.event_date < today;
      return true;
    })
    .filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.clients?.first_name?.toLowerCase().includes(q) ||
        e.clients?.last_name?.toLowerCase().includes(q) ||
        e.clients?.email?.toLowerCase().includes(q) ||
        e.event_type?.toLowerCase().includes(q) ||
        e.venue_city?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = a.event_date || '';
      const db = b.event_date || '';
      return sortDate === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });

  const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, events.filter(e => e.status === k).length]));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '36px 36px 60px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Événements</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{events.length} devis au total</p>
        </div>
        {/* Recherche */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, une ville…"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            padding: '9px 16px', fontSize: 14, color: 'rgba(255,255,255,0.8)',
            outline: 'none', width: 260,
          }}
        />
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            background: filter === f.key ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === f.key ? 'rgba(184,239,11,0.35)' : 'rgba(255,255,255,0.1)'}`,
            color: filter === f.key ? '#b8ef0b' : 'rgba(255,255,255,0.45)',
            borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: filter === f.key ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {f.label}{f.key !== 'all' && counts[f.key] ? ` (${counts[f.key]})` : ''}
          </button>
        ))}
      </div>

      {/* Filtres date */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { key: 'all',    label: 'Toutes les dates' },
          { key: 'avenir', label: '📅 À venir' },
          { key: 'mois',   label: 'Ce mois' },
          { key: 'passes', label: 'Passés' },
        ].map(f => (
          <button key={f.key} onClick={() => setDateFilter(f.key)} style={{
            background: dateFilter === f.key ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${dateFilter === f.key ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: dateFilter === f.key ? '#60a5fa' : 'rgba(255,255,255,0.35)',
            borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: dateFilter === f.key ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#0d1b2a', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {/* Header table */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px 32px',
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.03)',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span>Client</span>
          <span>Événement</span>
          <button
            onClick={() => setSortDate(s => s === 'asc' ? 'desc' : 'asc')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 11, fontWeight: 700, color: 'rgba(184,239,11,0.8)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Date {sortDate === 'asc' ? '↑' : '↓'}
          </button>
          <span>Invités</span>
          <span>Statut</span>
          <span style={{ textAlign: 'center' }}>Suppr.</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
            Aucun devis dans cette catégorie.
          </div>
        ) : (
          filtered.map((ev, i) => {
            const st = STATUS[ev.status] || STATUS.devis_envoye;
            return (
              <div
                key={ev.id}
                onClick={() => router.push(`/admin/evenements/${ev.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px 32px',
                  padding: '14px 20px', cursor: 'pointer', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px' }}>
                    {ev.clients?.first_name} {ev.clients?.last_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{ev.clients?.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>{ev.event_type || '—'}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{ev.venue_city || ''}</p>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{fmtDate(ev.event_date)}</p>
                <div>
                  {ev.guest_count > 0 ? (
                    <>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 1px', fontWeight: 500 }}>
                        {ev.guest_count} invité{ev.guest_count > 1 ? 's' : ''}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        {ev.guest_present > 0 && `${ev.guest_present} présent${ev.guest_present > 1 ? 's' : ''}`}
                        {ev.guest_pending > 0 && ` · ${ev.guest_pending} en attente`}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>—</p>
                  )}
                </div>
                <span style={{
                  background: `${st.color}15`, color: st.color,
                  border: `1px solid ${st.color}35`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  display: 'inline-block',
                }}>{st.label}</span>
                <button
                  onClick={e => handleDelete(e, ev)}
                  disabled={deletingId === ev.id}
                  title="Supprimer cet événement"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                    color: 'rgba(239,68,68,0.55)', opacity: deletingId === ev.id ? 0.4 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.55)'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
