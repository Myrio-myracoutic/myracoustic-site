'use client';
import { useState } from 'react';
import { ClipboardList, CheckCircle, CreditCard, PartyPopper, MessageCircle, FileText, ExternalLink } from 'lucide-react';

const TIMELINE_STEPS = [
  { id: 'devis_envoye', label: 'Devis envoyé',          icon: ClipboardList, statuses: ['devis_envoye', 'accepte', 'confirme', 'termine'] },
  { id: 'accepte',      label: 'Devis signé & acompte', icon: CreditCard,    statuses: ['accepte', 'confirme', 'termine'] },
  { id: 'confirme',     label: 'Réservation confirmée', icon: CheckCircle,   statuses: ['confirme', 'termine'] },
  { id: 'termine',      label: 'Événement réalisé',     icon: PartyPopper,   statuses: ['termine'] },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function Timeline({ status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done    = step.statuses.includes(status);
        const isLast  = i === TIMELINE_STEPS.length - 1;
        const nextDone = !isLast && TIMELINE_STEPS[i + 1].statuses.includes(status);
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : '1 1 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: done ? 'rgba(184,239,11,0.15)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? '#b8ef0b' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, color: done ? '#b8ef0b' : 'rgba(255,255,255,0.25)',
              }}>
                <step.icon size={18} strokeWidth={1.5} />
              </div>
              <span style={{
                fontSize: 11, color: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                textAlign: 'center', lineHeight: 1.4,
                fontFamily: 'var(--font-display), sans-serif', fontWeight: done ? 600 : 400,
              }}>{step.label}</span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px', marginBottom: 28,
                background: nextDone ? '#b8ef0b' : 'rgba(255,255,255,0.08)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const TABS = [
  { id: 'suivi',       label: 'Suivi' },
  { id: 'facturation', label: 'Facturation' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {TABS.map(t => {
        const isAct = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '7px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: isAct ? 700 : 500,
              fontFamily: 'var(--font-display), sans-serif',
              background: isAct ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.04)',
              color: isAct ? '#b8ef0b' : 'rgba(255,255,255,0.4)',
              borderBottom: isAct ? '2px solid #b8ef0b' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        );
      })}
    </div>
  );
}

export default function SuiviSection({ ev }) {
  const [tab, setTab] = useState('suivi');
  const annule = ev.status === 'annule';
  const active = ['accepte', 'confirme', 'termine'].includes(ev.status);

  return (
    <div>
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '24px 28px', marginBottom: 16,
      }}>
        <TabBar active={tab} onChange={setTab} />

        {tab === 'suivi' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              {fmtDate(ev.event_date)}
              {ev.venue_city ? ` · ${ev.venue_city}` : ''}
              {ev.guests ? ` · ${ev.guests} personnes` : ''}
            </p>

            {!annule && <Timeline status={ev.status} />}

            {annule && (
              <p style={{ color: '#ef4444', fontSize: 14 }}>Cet événement a été annulé.</p>
            )}

            {/* Message de Myracoustic */}
            {ev.client_message && (
              <div style={{
                background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.15)',
                borderRadius: 12, padding: '16px 20px', marginTop: 8,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <MessageCircle size={18} strokeWidth={1.5} color="#b8ef0b" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{
                    fontSize: 11, color: '#b8ef0b', fontWeight: 700, marginBottom: 6,
                    fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em',
                  }}>MESSAGE DE MYRACOUSTIC</div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                    {ev.client_message}
                  </p>
                </div>
              </div>
            )}

            {/* CTA devis si pas encore signé */}
            {!active && !annule && (
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '24px 28px', textAlign: 'center', marginTop: 16,
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.6 }}>
                  Confirmez votre réservation pour activer votre espace de suivi personnalisé.
                </p>
                {ev.qonto_quote_url && (
                  <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block', background: '#b8ef0b', color: '#060e16',
                    borderRadius: 8, padding: '12px 28px',
                    fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
                    textDecoration: 'none',
                  }}>Voir et signer mon devis →</a>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'facturation' && (
          <div>
            {ev.qonto_quote_url ? (
              <a href={ev.qonto_quote_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '16px 20px', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,239,11,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={20} color="#b8ef0b" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>
                      Devis Myracoustic
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                      Cliquez pour consulter ou télécharger
                    </div>
                  </div>
                  <ExternalLink size={16} color="rgba(255,255,255,0.3)" />
                </div>
              </a>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic' }}>
                Aucun document disponible pour le moment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
