'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import {
  ClipboardList, Calendar, Music2, CheckSquare,
  FileText, Phone, Camera, LogOut, ChevronDown,
} from 'lucide-react';

import SuiviSection      from './SuiviSection';
import ProgrammeSection  from './ProgrammeSection';
import PlaylistSection   from './PlaylistSection';
import PreparationSection from './PreparationSection';
import DocumentsSection  from './DocumentsSection';
import ContactSection, { FloatingContact } from './ContactSection';
import GalerieSection    from './GalerieSection';

const STATUS_LABELS = {
  devis_envoye: { label: 'Devis envoyé',          color: '#f59e0b' },
  accepte:      { label: 'Réservation confirmée', color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',              color: '#22c55e' },
  termine:      { label: 'Terminé',               color: 'rgba(255,255,255,0.3)' },
  annule:       { label: 'Annulé',                color: '#ef4444' },
};

function isActive(status) {
  return ['accepte', 'confirme', 'termine'].includes(status);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getSections(ev) {
  const active  = ev ? isActive(ev.status) : false;
  const termine = ev?.status === 'termine';
  return [
    { id: 'suivi',       label: 'Suivi projet',  shortLabel: 'Suivi',    icon: ClipboardList,  locked: false },
    { id: 'programme',   label: 'Programme',     shortLabel: 'Prog.',    icon: Calendar,       locked: !active },
    { id: 'playlist',    label: 'Playlist',      shortLabel: 'Playlist', icon: Music2,         locked: !active },
    { id: 'preparation', label: 'Préparation',   shortLabel: 'Prép.',    icon: CheckSquare,    locked: !active },
    { id: 'documents',   label: 'Documents',     shortLabel: 'Docs',     icon: FileText,       locked: false },
    { id: 'contact',     label: 'Contact',       shortLabel: 'Contact',  icon: Phone,          locked: false },
    { id: 'galerie',     label: 'Galerie',       shortLabel: 'Photos',   icon: Camera,         locked: !termine },
  ];
}

/* ── Sidebar desktop ───────────────────────────────────────────── */
function Sidebar({ sections, active, onSelect, client, ev, events, onEventChange, onLogout }) {
  const st = ev ? (STATUS_LABELS[ev.status] || STATUS_LABELS.devis_envoye) : null;

  return (
    <aside className="espace-sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <a href="/"><Image src="/logo.png" alt="Myracoustic" width={140} height={47} style={{ height: 47, width: 'auto' }} /></a>
      </div>

      {/* Info client + événement */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
          {client?.first_name} {client?.last_name}
        </div>
        {events.length > 1 ? (
          <select
            value={ev?.id || ''}
            onChange={e => onEventChange(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '5px 8px', color: 'rgba(255,255,255,0.6)',
              fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4,
            }}
          >
            {events.map(e => (
              <option key={e.id} value={e.id} style={{ background: '#0d1b2a' }}>
                {e.event_type} — {fmtDate(e.event_date)}
              </option>
            ))}
          </select>
        ) : ev ? (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
              {ev.event_type} · {fmtDate(ev.event_date)}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: st.color,
              background: `${st.color}18`, border: `1px solid ${st.color}35`,
              borderRadius: 10, padding: '2px 10px',
              fontFamily: 'var(--font-display), sans-serif',
            }}>{st.label}</span>
          </>
        ) : null}
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {sections.map(sec => {
          const isActive = sec.id === active;
          return (
            <button
              key={sec.id}
              onClick={() => !sec.locked && onSelect(sec.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2, border: 'none',
                background: isActive ? 'rgba(184,239,11,0.1)' : 'transparent',
                color: sec.locked ? 'rgba(255,255,255,0.2)'
                  : isActive ? '#b8ef0b' : 'rgba(255,255,255,0.55)',
                cursor: sec.locked ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: isActive ? 700 : 500,
              }}
              onMouseEnter={e => { if (!sec.locked && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!sec.locked && !isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <sec.icon size={16} strokeWidth={isActive ? 2 : 1.5} style={{ flexShrink: 0 }} />
              <span>{sec.label}</span>
              {sec.locked && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>🔒</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} strokeWidth={1.5} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

/* ── Bottom nav mobile ─────────────────────────────────────────── */
function BottomNav({ sections, active, onSelect }) {
  const visible = sections.filter(s => !s.locked || s.id === 'suivi');
  return (
    <nav className="espace-bottom-nav">
      {visible.map(sec => {
        const isAct = sec.id === active;
        return (
          <button
            key={sec.id}
            onClick={() => !sec.locked && onSelect(sec.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, border: 'none', background: 'transparent',
              color: isAct ? '#b8ef0b' : 'rgba(255,255,255,0.35)',
              cursor: sec.locked ? 'default' : 'pointer', padding: '8px 4px',
              transition: 'color 0.15s',
            }}
          >
            <sec.icon size={20} strokeWidth={isAct ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: isAct ? 700 : 400, fontFamily: 'var(--font-display), sans-serif' }}>
              {sec.shortLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Header mobile ─────────────────────────────────────────────── */
function MobileHeader({ client, ev, events, onEventChange, onLogout }) {
  const st = ev ? (STATUS_LABELS[ev.status] || STATUS_LABELS.devis_envoye) : null;
  return (
    <header className="espace-mobile-header">
      <a href="/"><Image src="/logo.png" alt="Myracoustic" width={120} height={40} style={{ height: 40, width: 'auto' }} /></a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {ev && st && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: st.color,
            background: `${st.color}18`, border: `1px solid ${st.color}30`,
            borderRadius: 10, padding: '3px 10px',
            fontFamily: 'var(--font-display), sans-serif',
          }}>{st.label}</span>
        )}
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.4)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}

/* ── Section title ─────────────────────────────────────────────── */
function SectionTitle({ section }) {
  const TITLES = {
    suivi:       'Suivi de votre événement',
    programme:   'Programme de votre événement',
    playlist:    'Vos playlists musicales',
    preparation: 'Checklist de préparation',
    documents:   'Vos documents',
    contact:     'Nous contacter',
    galerie:     'Galerie photos',
  };
  return (
    <h1 style={{
      fontFamily: 'var(--font-display), sans-serif',
      fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700,
      color: '#fff', margin: '0 0 24px',
    }}>{TITLES[section] || ''}</h1>
  );
}

/* ── Page principale ───────────────────────────────────────────── */
export default function MonEspacePage() {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [client,  setClient]  = useState(null);
  const [events,  setEvents]  = useState([]);
  const [eventId, setEventId] = useState(null);
  const [token,   setToken]   = useState('');
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('suivi');

  const ev = events.find(e => e.id === eventId) || events[0] || null;
  const sections = getSections(ev);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/mon-espace/connexion'); return; }
      setUser(session.user);
      setToken(session.access_token);

      const { data: clientData } = await supabase
        .from('clients').select('*').eq('auth_id', session.user.id).single();
      setClient(clientData);

      if (clientData) {
        const { data: eventsData } = await supabase
          .from('events').select('*').eq('client_id', clientData.id)
          .order('event_date', { ascending: true });
        const evs = eventsData || [];
        setEvents(evs);
        if (evs.length > 0) setEventId(evs[0].id);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/mon-espace/connexion');
  };

  const handleSectionSelect = (id) => {
    const sec = sections.find(s => s.id === id);
    if (!sec || sec.locked) return;
    setSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEventChange = (id) => {
    setEventId(id);
    setSection('suivi');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .sk { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 600px 100%; animation: shimmer 1.4s infinite linear; border-radius: 6px; }
      `}</style>
      {/* Skeleton sidebar desktop */}
      <div style={{ width: 240, background: '#07111c', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '28px 20px', flexShrink: 0 }} className="espace-sidebar">
        <div className="sk" style={{ width: 130, height: 40, marginBottom: 32 }} />
        <div className="sk" style={{ width: '70%', height: 12, marginBottom: 10 }} />
        <div className="sk" style={{ width: '50%', height: 10, marginBottom: 32 }} />
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="sk" style={{ width: '85%', height: 12, marginBottom: 14, borderRadius: 8 }} />
        ))}
      </div>
      {/* Skeleton main */}
      <div style={{ flex: 1, padding: '40px 40px', maxWidth: 900 }}>
        <div className="sk" style={{ width: 200, height: 22, marginBottom: 28 }} />
        <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px' }}>
          <div className="sk" style={{ width: 120, height: 11, marginBottom: 24 }} />
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="sk" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div className="sk" style={{ flex: 1, height: 40 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    if (!ev) return <p style={{ color: 'rgba(255,255,255,0.3)' }}>Aucun événement.</p>;
    const active = isActive(ev.status);
    const locked = sections.find(s => s.id === section)?.locked;

    if (locked) return (
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '40px 28px', textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 20 }}>
          Cette section sera disponible une fois votre réservation confirmée.
        </p>
        {ev.qonto_quote_url && (
          <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', background: '#b8ef0b', color: '#060e16',
            borderRadius: 8, padding: '10px 24px',
            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
          }}>Voir et signer mon devis →</a>
        )}
      </div>
    );

    switch (section) {
      case 'suivi':       return <SuiviSection ev={ev} />;
      case 'programme':   return <ProgrammeSection ev={ev} token={token} />;
      case 'playlist':    return <PlaylistSection eventId={ev.id} token={token} />;
      case 'preparation': return <PreparationSection ev={ev} token={token} />;
      case 'documents':   return <DocumentsSection ev={ev} />;
      case 'contact':     return <ContactSection />;
      case 'galerie':     return <GalerieSection ev={ev} />;
      default:            return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060e16', fontFamily: 'var(--font-body), sans-serif' }}>
      <style>{`
        .espace-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 240px;
          background: #07111c; border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column; z-index: 100; overflow-y: auto;
        }
        .espace-mobile-header { display: none; }
        .espace-main { margin-left: 240px; min-height: 100vh; padding: 40px 40px 60px; max-width: 900px; }
        .espace-bottom-nav { display: none; }
        .floating-contact { bottom: 28px; right: 28px; }

        @media (max-width: 1023px) {
          .espace-sidebar { display: none; }
          .espace-mobile-header {
            display: flex; align-items: center; justify-content: space-between;
            position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: 100;
            background: rgba(6,14,22,0.97); backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 16px;
          }
          .espace-main { margin-left: 0; padding: 76px 16px 88px; max-width: 100%; }
          .espace-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 66px;
            background: rgba(7,17,28,0.97); backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255,255,255,0.07); z-index: 100; padding: 0 4px;
          }
          .floating-contact { bottom: 80px; right: 16px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Sidebar desktop */}
      <Sidebar
        sections={sections} active={section} onSelect={handleSectionSelect}
        client={client} ev={ev} events={events}
        onEventChange={handleEventChange} onLogout={handleLogout}
      />

      {/* Header mobile */}
      <MobileHeader client={client} ev={ev} events={events} onEventChange={handleEventChange} onLogout={handleLogout} />

      {/* Contenu principal */}
      <main className="espace-main">
        {/* Sélecteur événement mobile (si plusieurs) */}
        {events.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <select
              value={ev?.id || ''}
              onChange={e => handleEventChange(e.target.value)}
              style={{
                width: '100%', background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 14px', color: 'rgba(255,255,255,0.7)',
                fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {events.map(e => (
                <option key={e.id} value={e.id} style={{ background: '#0d1b2a' }}>
                  {e.event_type} — {fmtDate(e.event_date)}
                </option>
              ))}
            </select>
          </div>
        )}

        <SectionTitle section={section} />
        {renderSection()}
      </main>

      {/* Bottom nav mobile */}
      <BottomNav sections={sections} active={section} onSelect={handleSectionSelect} />

      {/* Bouton contact flottant */}
      <FloatingContact activeSection={section} />
    </div>
  );
}
