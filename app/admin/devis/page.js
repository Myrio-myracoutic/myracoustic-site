'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'il y a moins d\'1h';
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

const STEP_LABELS = ['Calendrier', 'Identité', 'Événement', 'Prestations', 'Facturation', 'Récapitulatif'];
const TOTAL_STEPS = 5;

function ProspectsSection() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(true);

  const load = () => {
    fetch('/api/admin/prospects')
      .then(r => r.json())
      .then(d => { setProspects(d.prospects || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (email) => {
    if (!confirm(`Supprimer le prospect ${email} ?`)) return;
    await fetch('/api/admin/prospects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    load();
  };

  if (loading || prospects.length === 0) return null;

  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, border: '1px solid rgba(245,158,11,0.2)',
      overflow: 'hidden', marginBottom: 24,
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: 'rgba(245,158,11,0.06)',
          border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#f59e0b',
            boxShadow: '0 0 6px #f59e0b', display: 'inline-block', animation: 'pulse-p 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 12, fontWeight: 700,
            color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Prospects en cours
          </span>
          <span style={{
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700,
          }}>{prospects.length}</span>
        </div>
        {open
          ? <ChevronUp size={15} color="#f59e0b" />
          : <ChevronDown size={15} color="#f59e0b" />
        }
      </button>

      {open && (
        <div>
          <style>{`@keyframes pulse-p { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          {/* En-tête colonnes */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.4fr 32px',
            padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span>Email</span>
            <span>Événement</span>
            <span>Date souhaitée</span>
            <span>Lieu</span>
            <span>Progression</span>
            <span />
          </div>

          {prospects.map((p, i) => {
            const d  = p.data || {};
            const pct = Math.round((p.step / TOTAL_STEPS) * 100);
            const stepLabel = STEP_LABELS[p.step] || `Étape ${p.step}`;
            return (
              <div key={p.email} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.4fr 32px',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: i < prospects.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {d.prenom || ''} {d.nom || ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {p.email} · {timeAgo(p.updated_at)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  {d.eventType || '—'}
                </div>
                <div style={{ fontSize: 13, color: d.date ? '#b8ef0b' : 'rgba(255,255,255,0.25)', fontWeight: d.date ? 600 : 400 }}>
                  {d.date ? fmtDate(d.date) : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.lieu?.split(',')[0] || '—'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0, minWidth: 60 }}>
                      {stepLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.email)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'rgba(255,255,255,0.2)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDevisPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setEvents(d); setLoading(false); } });
  }, []);

  const filtered = events
    .filter(e => filter === 'all' || e.status === filter)
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
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Devis</h1>
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

      {/* Prospects en cours */}
      <ProspectsSection />

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
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
          <span>Date</span>
          <span>Invités</span>
          <span>Statut</span>
          <span />
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
                onClick={() => router.push(`/admin/devis/${ev.id}`)}
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
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{ev.guests ? `${ev.guests} pers.` : '—'}</p>
                <span style={{
                  background: `${st.color}15`, color: st.color,
                  border: `1px solid ${st.color}35`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  display: 'inline-block',
                }}>{st.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, textAlign: 'center' }}>›</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
