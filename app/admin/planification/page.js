'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from 'lucide-react';

/* ── Constantes ───────────────────────────────────────────────── */
const MOIS_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS_FR  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const TODAY_STR = new Date().toISOString().slice(0,10);

const STATUS_CFG = {
  devis_envoye: { label: 'Devis envoyé',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  accepte:      { label: 'Devis signé',          color: '#b8ef0b', bg: 'rgba(184,239,11,0.15)' },
  confirme:     { label: 'Réservation confirmée',color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  termine:      { label: 'Terminé',              color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  annule:       { label: 'Annulé',               color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

function fmtD(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function dow0(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; } // 0=lundi

/* ── Chip d'événement ─────────────────────────────────────────── */
function EventChip({ ev, onClick }) {
  const cfg = STATUS_CFG[ev.status] || STATUS_CFG.devis_envoye;
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(ev); }}
      style={{
        background: cfg.bg, borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 4, padding: '2px 6px', marginBottom: 2, cursor: 'pointer',
        fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {ev.clients?.first_name} {ev.clients?.last_name} · {ev.event_type || '?'}
    </div>
  );
}

/* ── Vue Mois ─────────────────────────────────────────────────── */
function MonthView({ year, month, events, onEventClick, onDayClick }) {
  const dim  = new Date(year, month+1, 0).getDate();
  const fd   = dow0(year, month);
  const days = [...Array(fd).fill(null), ...Array.from({length: dim}, (_,i) => i+1)];
  while (days.length % 7 !== 0) days.push(null);

  const evByDay = {};
  events.forEach(ev => { if (!ev.event_date) return; if (!evByDay[ev.event_date]) evByDay[ev.event_date] = []; evByDay[ev.event_date].push(ev); });

  return (
    <div>
      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {JOURS_FR.map(j => (
          <div key={j} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 0', letterSpacing: '0.05em' }}>{j}</div>
        ))}
      </div>
      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (!d) return <div key={i} style={{ minHeight: 80 }} />;
          const k    = dateKey(year, month, d);
          const evs  = evByDay[k] || [];
          const isToday = k === TODAY_STR;
          return (
            <div
              key={i}
              onClick={() => onDayClick(k)}
              style={{
                minHeight: 80, background: isToday ? 'rgba(184,239,11,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isToday ? 'rgba(184,239,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6, padding: '5px 6px', cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div style={{
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                color: isToday ? '#b8ef0b' : 'rgba(255,255,255,0.5)',
                marginBottom: 4,
              }}>{d}</div>
              {evs.slice(0, 3).map(ev => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)}
              {evs.length > 3 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingLeft: 4 }}>+{evs.length-3}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Vue Semaine ──────────────────────────────────────────────── */
function WeekView({ weekStart, events, onEventClick }) {
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0,10), label: d.getDate(), dow: JOURS_FR[i] };
  });
  const evByDay = {};
  events.forEach(ev => { if (!ev.event_date) return; if (!evByDay[ev.event_date]) evByDay[ev.event_date] = []; evByDay[ev.event_date].push(ev); });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
      {days.map(day => {
        const isToday = day.date === TODAY_STR;
        const evs = evByDay[day.date] || [];
        return (
          <div key={day.date} style={{
            background: isToday ? 'rgba(184,239,11,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isToday ? 'rgba(184,239,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8, padding: '10px 8px', minHeight: 200,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{day.dow}</div>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: isToday ? '#b8ef0b' : 'rgba(255,255,255,0.7)',
              }}>{day.label}</div>
            </div>
            {evs.map(ev => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)}
            {evs.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 20 }}>—</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Vue Année ────────────────────────────────────────────────── */
function YearView({ year, events, onMonthClick }) {
  const evByMonth = {};
  events.forEach(ev => {
    if (!ev.event_date || !ev.event_date.startsWith(String(year))) return;
    const m = parseInt(ev.event_date.slice(5,7)) - 1;
    if (!evByMonth[m]) evByMonth[m] = [];
    evByMonth[m].push(ev);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {MOIS_FR.map((mois, m) => {
        const evs = evByMonth[m] || [];
        const dim  = new Date(year, m+1, 0).getDate();
        const fd   = dow0(year, m);
        const days = [...Array(fd).fill(null), ...Array.from({length: dim}, (_,i) => i+1)];
        const evDays = new Set(evs.map(ev => parseInt(ev.event_date.slice(8))));
        return (
          <div
            key={m}
            onClick={() => onMonthClick(m)}
            style={{
              background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,239,11,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-display)' }}>{mois}</span>
              {evs.length > 0 && (
                <span style={{ fontSize: 11, background: 'rgba(184,239,11,0.12)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                  {evs.length}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
              {days.map((d, i) => d ? (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: 3, fontSize: 9, textAlign: 'center', lineHeight: '18px',
                  background: evDays.has(d) ? 'rgba(184,239,11,0.2)' : 'transparent',
                  color: evDays.has(d) ? '#b8ef0b' : 'rgba(255,255,255,0.3)',
                  fontWeight: evDays.has(d) ? 700 : 400,
                }}>{d}</div>
              ) : <div key={i} style={{ width: 18, height: 18 }} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Vue Jour ─────────────────────────────────────────────────── */
function DayView({ dateStr, events, programmes, onEventClick }) {
  const evs = events.filter(e => e.event_date === dateStr);
  const d   = new Date(dateStr + 'T12:00:00');
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 20, textTransform: 'capitalize' }}>{label}</div>
      {evs.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Aucun événement ce jour.</div>
      ) : (
        evs.map(ev => {
          const cfg = STATUS_CFG[ev.status] || STATUS_CFG.devis_envoye;
          const prog = programmes[ev.id] || [];
          return (
            <div key={ev.id} style={{
              background: '#0d1b2a', border: `1px solid ${cfg.color}30`,
              borderLeft: `4px solid ${cfg.color}`,
              borderRadius: 10, padding: '18px 20px', marginBottom: 16, cursor: 'pointer',
            }} onClick={() => onEventClick(ev)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    {ev.clients?.first_name} {ev.clients?.last_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {ev.event_type || '—'}{ev.venue_city ? ` · ${ev.venue_city}` : ''}
                  </div>
                </div>
                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                  {cfg.label}
                </span>
              </div>
              {/* Programme */}
              {prog.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: 8 }}>PROGRAMME</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {prog.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'flex-start' }}>
                        <span style={{ color: '#b8ef0b', fontWeight: 600, minWidth: 44, fontFamily: 'var(--font-display)' }}>{item.time}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Vue Kanban ───────────────────────────────────────────────── */
const KANBAN_COLS = [
  { status: 'devis_envoye', label: 'Devis envoyé',         color: '#f59e0b' },
  { status: 'accepte',      label: 'Devis signé',           color: '#b8ef0b' },
  { status: 'confirme',     label: 'Réservation confirmée', color: '#22c55e' },
  { status: 'termine',      label: 'Terminé',               color: '#9ca3af' },
  { status: 'annule',       label: 'Annulé',                color: '#ef4444' },
];

function KanbanView({ events, onEventClick }) {
  const byStatus = {};
  KANBAN_COLS.forEach(col => { byStatus[col.status] = []; });
  events.forEach(ev => { if (byStatus[ev.status]) byStatus[ev.status].push(ev); });

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
      {KANBAN_COLS.map(col => {
        const evs = byStatus[col.status] || [];
        return (
          <div key={col.status} style={{ minWidth: 220, flex: '0 0 220px' }}>
            {/* En-tête colonne */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: `${col.color}10`,
              border: `1px solid ${col.color}25`, borderRadius: '8px 8px 0 0',
              marginBottom: 1,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: col.color, fontFamily: 'var(--font-display)' }}>{col.label}</span>
              <span style={{
                fontSize: 11, background: `${col.color}20`, color: col.color,
                borderRadius: 10, padding: '1px 7px', fontWeight: 700,
              }}>{evs.length}</span>
            </div>
            {/* Cartes */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderTop: 'none', borderRadius: '0 0 8px 8px',
              padding: '8px', minHeight: 120,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {evs
                .sort((a, b) => (a.event_date || '9999') < (b.event_date || '9999') ? -1 : 1)
                .map(ev => {
                  const cfg = STATUS_CFG[ev.status] || STATUS_CFG.devis_envoye;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      style={{
                        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)',
                        borderLeft: `3px solid ${cfg.color}`,
                        borderRadius: 7, padding: '10px 12px', cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                        {ev.clients?.first_name} {ev.clients?.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: ev.event_date ? 4 : 0 }}>
                        {ev.event_type || '—'}
                      </div>
                      {ev.event_date && (
                        <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                          📅 {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              {evs.length === 0 && (
                <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Vide</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page principale ──────────────────────────────────────────── */
export default function EvenementsPage() {
  const router = useRouter();
  const [events,     setEvents]     = useState([]);
  const [programmes, setProgrammes] = useState({});
  const [loading,    setLoading]    = useState(true);

  // Navigation
  const [view,   setView]   = useState('mois');   // mois | semaine | jour | annee | kanban
  const [year,   setYear]   = useState(new Date().getFullYear());
  const [month,  setMonth]  = useState(new Date().getMonth());
  const [day,    setDay]    = useState(TODAY_STR);

  // Semaine courante (lundi)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d.toISOString().slice(0,10);
  });

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setEvents(d); setLoading(false); } });
  }, []);

  // Charger le programme d'un événement si vue jour
  const loadProgramme = useCallback(async (eventId) => {
    if (programmes[eventId]) return;
    const token = ''; // admin n'a pas de token JWT — on skip, pas critique
    const res = await fetch(`/api/mon-espace/programme/${eventId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setProgrammes(p => ({ ...p, [eventId]: data.items || [] }));
    }
  }, [programmes]);

  useEffect(() => {
    if (view === 'jour') {
      const evs = events.filter(e => e.event_date === day);
      evs.forEach(ev => loadProgramme(ev.id));
    }
  }, [view, day, events]);

  // Navigation
  const prevMonth  = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth  = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };
  const prevWeek   = () => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d.toISOString().slice(0,10)); };
  const nextWeek   = () => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d.toISOString().slice(0,10)); };
  const prevYear   = () => setYear(y => y-1);
  const nextYear   = () => setYear(y => y+1);
  const prevDay    = () => { const d = new Date(day); d.setDate(d.getDate()-1); setDay(d.toISOString().slice(0,10)); };
  const nextDay    = () => { const d = new Date(day); d.setDate(d.getDate()+1); setDay(d.toISOString().slice(0,10)); };
  const goToday    = () => {
    const now = new Date();
    setYear(now.getFullYear()); setMonth(now.getMonth()); setDay(TODAY_STR);
    const d = new Date(); d.setHours(0,0,0,0);
    const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow);
    setWeekStart(d.toISOString().slice(0,10));
  };

  const onEventClick = (ev) => router.push(`/admin/evenements/${ev.id}`);
  const onDayClick   = (dateStr) => { setDay(dateStr); setView('jour'); };
  const onMonthClick = (m) => { setMonth(m); setView('mois'); };

  // Label de navigation
  const navLabel = () => {
    if (view === 'mois')   return `${MOIS_FR[month]} ${year}`;
    if (view === 'annee')  return String(year);
    if (view === 'jour')   return new Date(day+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    if (view === 'semaine'){
      const end = new Date(weekStart); end.setDate(end.getDate()+6);
      return `${new Date(weekStart).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} – ${end.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`;
    }
    return '';
  };
  const hasPrevNext = view !== 'kanban';
  const prev = () => ({ mois: prevMonth, semaine: prevWeek, jour: prevDay, annee: prevYear })[view]?.();
  const next = () => ({ mois: nextMonth, semaine: nextWeek, jour: nextDay, annee: nextYear })[view]?.();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const VIEWS = [
    { id: 'kanban',  label: 'Kanban',  icon: LayoutGrid },
    { id: 'mois',    label: 'Mois',    icon: Calendar },
    { id: 'semaine', label: 'Semaine', icon: Calendar },
    { id: 'jour',    label: 'Jour',    icon: Calendar },
    { id: 'annee',   label: 'Année',   icon: Calendar },
  ];

  return (
    <div style={{ padding: '28px 28px 60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
          Planification
        </h1>

        {/* Sélecteur de vue */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: '6px 14px', border: 'none', borderRadius: 7, cursor: 'pointer',
              background: view === v.id ? '#b8ef0b' : 'transparent',
              color: view === v.id ? '#060e16' : 'rgba(255,255,255,0.45)',
              fontSize: 12, fontWeight: view === v.id ? 700 : 400,
              fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.15s',
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Barre de navigation */}
      {hasPrevNext && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={goToday} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7, padding: '7px 14px', color: 'rgba(255,255,255,0.6)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
          }}>Aujourd'hui</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={prev} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff', minWidth: 200, textAlign: 'center', textTransform: 'capitalize' }}>
              {navLabel()}
            </span>
            <button onClick={next} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={15} />
            </button>
          </div>
          {/* Compteur */}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>
            {events.filter(e => e.event_date).length} événements avec date
          </span>
        </div>
      )}

      {/* Contenu de la vue */}
      {view === 'mois'    && <MonthView  year={year} month={month} events={events} onEventClick={onEventClick} onDayClick={onDayClick} />}
      {view === 'semaine' && <WeekView   weekStart={weekStart} events={events} onEventClick={onEventClick} />}
      {view === 'jour'    && <DayView    dateStr={day} events={events} programmes={programmes} onEventClick={onEventClick} />}
      {view === 'annee'   && <YearView   year={year} events={events} onMonthClick={onMonthClick} />}
      {view === 'kanban'  && <KanbanView events={events} onEventClick={onEventClick} />}
    </div>
  );
}
