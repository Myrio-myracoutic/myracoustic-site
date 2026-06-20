'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import { ClipboardList, CheckCircle, CreditCard, PartyPopper, MessageCircle } from 'lucide-react';
import PlaylistSection from './PlaylistSection';

const STATUS_LABELS = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Réservation confirmée', color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',      color: '#22c55e' },
  termine:      { label: 'Terminé',       color: 'rgba(255,255,255,0.3)' },
  annule:       { label: 'Annulé',        color: '#ef4444' },
};

const TIMELINE_STEPS = [
  { id: 'devis_envoye', label: 'Devis envoyé',         icon: ClipboardList, statuses: ['devis_envoye', 'accepte', 'confirme', 'termine'] },
  { id: 'accepte',      label: 'Réservation confirmée', icon: CheckCircle,   statuses: ['accepte', 'confirme', 'termine'] },
  { id: 'confirme',     label: 'Contrat & acompte',     icon: CreditCard,    statuses: ['confirme', 'termine'] },
  { id: 'termine',      label: 'Événement réalisé',     icon: PartyPopper,   statuses: ['termine'] },
];

const CHECKLISTS = {
  mariage: [
    'Date et salle de réception confirmées',
    'Chanson de la première danse choisie',
    'Brief musical envoyé à Myracoustic',
    'Planning de la soirée transmis',
    'Accès pour le matériel confirmé (horaires, ascenseur)',
    'Contacts du traiteur / wedding planner partagés',
  ],
  pacs: [
    'Date et lieu confirmés',
    'Brief musical envoyé à Myracoustic',
    'Planning de la soirée transmis',
    'Accès pour le matériel confirmé',
  ],
  anniversaire: [
    'Date et lieu confirmés',
    'Thème et ambiance définis',
    'Brief musical envoyé à Myracoustic',
    'Accès pour le matériel confirmé',
  ],
  seminaire: [
    'Date et lieu confirmés',
    'Programme de la journée transmis',
    'Brief technique envoyé (micro, écran, sonorisation)',
    'Accès et horaires de montage confirmés',
  ],
  default: [
    'Date et lieu confirmés',
    'Brief envoyé à Myracoustic',
    'Accès pour le matériel confirmé',
  ],
};

function getChecklist(eventType) {
  if (!eventType) return CHECKLISTS.default;
  const t = eventType.toLowerCase();
  if (t.includes('mariage')) return CHECKLISTS.mariage;
  if (t.includes('pacs')) return CHECKLISTS.pacs;
  if (t.includes('anniversaire') || t.includes('mitzvah') || t.includes('communion') || t.includes('familiale')) return CHECKLISTS.anniversaire;
  if (t.includes('séminaire') || t.includes('seminaire') || t.includes('gala') || t.includes('corporate') || t.includes('entreprise')) return CHECKLISTS.seminaire;
  return CHECKLISTS.default;
}

function isActive(status) {
  return ['accepte', 'confirme', 'termine'].includes(status);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function Timeline({ status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = step.statuses.includes(status);
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : '1 1 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: done ? 'rgba(184,239,11,0.15)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? '#b8ef0b' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, transition: 'all 0.3s',
                color: done ? '#b8ef0b' : 'rgba(255,255,255,0.25)',
              }}><step.icon size={18} strokeWidth={1.5} /></div>
              <span style={{
                fontSize: 11, color: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                textAlign: 'center', lineHeight: 1.4, fontFamily: 'var(--font-display), sans-serif',
                fontWeight: done ? 600 : 400,
              }}>{step.label}</span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px',
                background: done && TIMELINE_STEPS[i + 1].statuses.includes(status)
                  ? 'linear-gradient(90deg, #b8ef0b, #b8ef0b)'
                  : 'rgba(255,255,255,0.08)',
                marginBottom: 28, transition: 'all 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistSection({ ev, token }) {
  const items = getChecklist(ev.event_type);
  const [checked, setChecked] = useState(Array.isArray(ev.checklist_checked) ? ev.checklist_checked : []);
  const [saving, setSaving] = useState(false);

  const toggle = async (item) => {
    const next = checked.includes(item) ? checked.filter(i => i !== item) : [...checked, item];
    setChecked(next);
    setSaving(true);
    await fetch(`/api/mon-espace/checklist/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, checked: next }),
    });
    setSaving(false);
  };

  const done = items.filter(i => checked.includes(i)).length;

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>Checklist de préparation</h3>
        <span style={{ fontSize: 12, color: done === items.length ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
          {done}/{items.length} {saving ? '·  enreg…' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div
              onClick={() => toggle(item)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: checked.includes(item) ? '#b8ef0b' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${checked.includes(item) ? '#b8ef0b' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              {checked.includes(item) && <span style={{ color: '#060e16', fontSize: 12, fontWeight: 900 }}>✓</span>}
            </div>
            <span
              onClick={() => toggle(item)}
              style={{
                fontSize: 14, color: checked.includes(item) ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)',
                textDecoration: checked.includes(item) ? 'line-through' : 'none',
                transition: 'all 0.2s', lineHeight: 1.5,
              }}
            >{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function EventCard({ ev, token }) {
  const st = STATUS_LABELS[ev.status] || STATUS_LABELS.devis_envoye;
  const active = isActive(ev.status);
  const annule = ev.status === 'annule';

  return (
    <div style={{
      background: '#0d1b2a', border: `1px solid ${active ? 'rgba(184,239,11,0.15)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 16, padding: '28px 32px', marginBottom: 24,
      opacity: annule ? 0.5 : 1,
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 700,
            color: '#fff', margin: '0 0 6px',
          }}>{ev.event_type || 'Événement'}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
            {fmtDate(ev.event_date)}{ev.venue_city ? ` · ${ev.venue_city}` : ''}
            {ev.guests ? ` · ${ev.guests} personnes` : ''}
          </p>
        </div>
        <span style={{
          background: `${st.color}18`, color: st.color,
          border: `1px solid ${st.color}40`,
          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
          fontFamily: 'var(--font-display), sans-serif', whiteSpace: 'nowrap', flexShrink: 0,
        }}>{st.label}</span>
      </div>

      {/* Timeline */}
      {!annule && <Timeline status={ev.status} />}

      {/* Message de Myracoustic */}
      {ev.client_message && (
        <div style={{
          background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.15)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ flexShrink: 0, color: '#b8ef0b' }}><MessageCircle size={18} strokeWidth={1.5} /></span>
          <div>
            <div style={{ fontSize: 11, color: '#b8ef0b', fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display), sans-serif' }}>
              MESSAGE DE MYRACOUSTIC
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {ev.client_message}
            </p>
          </div>
        </div>
      )}

      {/* Mode aperçu : CTA devis */}
      {!active && !annule && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '20px 24px', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
            Confirmez votre réservation pour activer votre espace de suivi personnalisé.
          </p>
          {ev.qonto_quote_url && (
            <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block',
              background: '#b8ef0b', color: '#060e16',
              borderRadius: 8, padding: '10px 24px',
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}>Voir et signer mon devis →</a>
          )}
        </div>
      )}

      {/* Mode actif : checklist + playlists + lien devis */}
      {active && (
        <>
          <ChecklistSection ev={ev} token={token} />
          {token && <PlaylistSection eventId={ev.id} token={token} />}
          {ev.qonto_quote_url && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 18px',
              flexWrap: 'wrap', gap: 12,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Votre devis Myracoustic</span>
              <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
                color: '#b8ef0b', fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none',
              }}>Télécharger le devis →</a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MonEspacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/mon-espace/connexion'); return; }
      setUser(session.user);
      setToken(session.access_token);

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();
      setClient(clientData);

      if (clientData) {
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('client_id', clientData.id)
          .order('event_date', { ascending: true });
        setEvents(eventsData || []);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/mon-espace/connexion');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#060e16', fontFamily: 'var(--font-body), sans-serif' }}>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 70,
      }}>
        <a href="/"><Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto' }} /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            {client?.first_name} {client?.last_name}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.45)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Déconnexion</button>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '100px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,28px)',
          fontWeight: 700, color: '#fff', marginBottom: 6,
        }}>Bonjour {client?.first_name}</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 40 }}>
          Suivez l'avancement de votre événement Myracoustic.
        </p>

        {events.length === 0 ? (
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '40px 32px', textAlign: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>Aucun événement pour le moment.</div>
        ) : (
          events.map(ev => <EventCard key={ev.id} ev={ev} token={token} />)
        )}
      </div>
    </div>
  );
}
