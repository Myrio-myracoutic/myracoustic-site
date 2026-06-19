'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const STATUS_LABELS = {
  devis_envoye:  { label: 'Devis envoyé',   color: '#f59e0b' },
  accepte:       { label: 'Devis accepté',   color: '#b8ef0b' },
  confirme:      { label: 'Confirmé',        color: '#22c55e' },
  termine:       { label: 'Terminé',         color: 'rgba(255,255,255,0.3)' },
  annule:        { label: 'Annulé',          color: '#ef4444' },
};

export default function MonEspacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/mon-espace/connexion'); return; }
      setUser(session.user);

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
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 70,
      }}>
        <a href="/"><Image src="/logo.png" alt="Myracoustic" width={140} height={48} style={{ height: 40, width: 'auto' }} /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {client?.first_name} {client?.last_name}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '6px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Déconnexion</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ paddingTop: 110, paddingBottom: 80, maxWidth: 800, margin: '0 auto', padding: '110px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,3vw,32px)',
          fontWeight: 700, color: '#fff', marginBottom: 8,
        }}>
          Bonjour {client?.first_name} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 48 }}>
          Retrouvez ici le suivi de vos événements Myracoustic.
        </p>

        {events.length === 0 ? (
          <div style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '40px 32px', textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
              Aucun événement pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map(ev => {
              const st = STATUS_LABELS[ev.status] || STATUS_LABELS.devis_envoye;
              const dateStr = ev.event_date
                ? new Date(ev.event_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—';
              return (
                <div key={ev.id} style={{
                  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '24px 28px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{
                          background: `${st.color}18`, color: st.color,
                          border: `1px solid ${st.color}40`,
                          borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                          fontFamily: 'var(--font-display), sans-serif',
                        }}>{st.label}</span>
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                        {ev.event_type || 'Événement'}
                      </h2>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
                        {dateStr}{ev.venue_city ? ` · ${ev.venue_city}` : ''}
                      </p>
                    </div>
                    {ev.qonto_quote_url && (
                      <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
                        background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)',
                        borderRadius: 8, padding: '8px 16px', color: '#b8ef0b', fontSize: 13,
                        fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}>Voir le devis →</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
