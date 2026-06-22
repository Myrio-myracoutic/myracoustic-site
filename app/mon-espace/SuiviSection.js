'use client';
import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle, CreditCard, PartyPopper,
  MessageCircle, FileText, ExternalLink,
  Users, Music2, Calendar, AlertCircle, Clock,
} from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const evDate = new Date(dateStr + 'T00:00:00');
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((evDate - today) / (1000 * 60 * 60 * 24));
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const TIMELINE_STEPS = [
  { id: 'devis_envoye', label: 'Devis\nenvoyé',        icon: ClipboardList, statuses: ['devis_envoye', 'accepte', 'confirme', 'termine'] },
  { id: 'accepte',      label: 'Devis\nsigné',          icon: CreditCard,    statuses: ['accepte', 'confirme', 'termine'] },
  { id: 'confirme',     label: 'Réservation\nconfirmée', icon: CheckCircle,  statuses: ['confirme', 'termine'] },
  { id: 'preparation',  label: 'Préparation\nen cours', icon: Clock,         statuses: ['confirme', 'termine'] },
  { id: 'termine',      label: 'Terminé',               icon: PartyPopper,   statuses: ['termine'] },
];

// État d'une étape : 'done' | 'current' | 'pending'
function getStepState(step, idx, steps, status) {
  if (!step.statuses.includes(status)) return 'pending';
  // Y a-t-il une étape SUIVANTE qui inclut aussi le statut actuel ?
  const hasLaterActive = steps.slice(idx + 1).some(s => s.statuses.includes(status));
  return hasLaterActive ? 'done' : 'current';
}

function Timeline({ status }) {
  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(184,239,11,0.4); }
          70%  { box-shadow: 0 0 0 7px rgba(184,239,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(184,239,11,0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
        {TIMELINE_STEPS.map((step, i) => {
          const state  = getStepState(step, i, TIMELINE_STEPS, status);
          const isLast = i === TIMELINE_STEPS.length - 1;
          const nextState = !isLast ? getStepState(TIMELINE_STEPS[i + 1], i + 1, TIMELINE_STEPS, status) : null;
          const lineActive = nextState === 'done' || nextState === 'current';

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : '1 1 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 68 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: state !== 'pending' ? 'rgba(184,239,11,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${state !== 'pending' ? '#b8ef0b' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 7,
                  color: state !== 'pending' ? '#b8ef0b' : 'rgba(255,255,255,0.2)',
                  animation: state === 'current' ? 'pulse-ring 2s ease-out infinite' : 'none',
                  transition: 'all 0.3s',
                }}>
                  <step.icon size={16} strokeWidth={1.5} />
                </div>
                <span style={{
                  fontSize: 10,
                  color: state === 'done' ? 'rgba(255,255,255,0.65)'
                    : state === 'current' ? '#b8ef0b'
                    : 'rgba(255,255,255,0.2)',
                  textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line',
                  fontFamily: 'var(--font-display), sans-serif',
                  fontWeight: state !== 'pending' ? 600 : 400,
                }}>{step.label}</span>
              </div>
              {!isLast && (
                <div style={{
                  flex: 1, height: 2, margin: '0 3px', marginBottom: 30,
                  background: lineActive ? '#b8ef0b' : 'rgba(255,255,255,0.07)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatLine({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{label}</span>
      <span style={{ color: color || 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const TYPE_LABELS = {
  deposit: 'Facture d\'acompte',
  balance: 'Facture de solde',
};

function DocRow({ icon: Icon, iconColor, title, subtitle, url, badge, badgeColor, payUrl }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '14px 18px', marginBottom: 10,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${iconColor}14`, border: `1px solid ${iconColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={iconColor} strokeWidth={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 10,
            background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}35`,
          }}>{badge}</span>
        )}
        {payUrl && (
          <a href={payUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#b8ef0b', color: '#060e16',
            borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            fontFamily: 'var(--font-display), sans-serif',
          }}>
            Payer →
          </a>
        )}
        {url && !payUrl && <ExternalLink size={15} color="rgba(255,255,255,0.25)" />}
      </div>
    </div>
  );
}

function FacturationTab({ ev, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !ev?.id) { setLoading(false); return; }
    fetch(`/api/mon-espace/facturation/${ev.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ev?.id, token]);

  if (loading) return (
    <div>
      <style>{`
        @keyframes shimmer-fact {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .sk-fact {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 600px 100%;
          animation: shimmer-fact 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 10,
        }}>
          <div className="sk-fact" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk-fact" style={{ width: '55%', height: 13, marginBottom: 8 }} />
            <div className="sk-fact" style={{ width: '35%', height: 10 }} />
          </div>
          <div className="sk-fact" style={{ width: 60, height: 22, borderRadius: 10, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );

  const hasDocuments = data?.quote || data?.invoices?.length > 0;

  if (!hasDocuments) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic' }}>
        Aucun document disponible pour le moment.
      </p>
    );
  }

  const fmtDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fmtEur = (v) => v > 0 ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €' : null;

  return (
    <div>
      {/* Devis */}
      {data.quote && (
        <DocRow
          icon={FileText}
          iconColor="#b8ef0b"
          title="Devis Myracoustic"
          subtitle={data.quote.total > 0 ? `Montant total : ${fmtEur(data.quote.total)}` : 'Cliquez pour consulter ou télécharger'}
          url={data.quote.url}
        />
      )}

      {/* Factures */}
      {(data.invoices || []).map(inv => {
        const isPaid    = inv.status === 'paid';
        const isOverdue = !isPaid && inv.due_date && new Date(inv.due_date) < new Date();
        const label     = TYPE_LABELS[inv.type] || `Facture ${inv.number}`;
        const badge     = isPaid ? 'Payée' : isOverdue ? 'En retard' : 'En attente';
        const badgeColor = isPaid ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b';

        // Bouton Payer visible :
        // - Acompte (deposit) : dès que non payé
        // - Solde (balance)   : à partir de J-1 avant l'événement (ou après)
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const eventDay = data.event_date ? new Date(data.event_date + 'T00:00:00') : null;
        const j1       = eventDay ? new Date(eventDay.getTime() - 24 * 60 * 60 * 1000) : null;
        const payVisible = !isPaid && inv.pay_url && (
          inv.type === 'deposit' || !j1 || today >= j1
        );

        const sub = [
          inv.amount > 0 ? fmtEur(inv.amount) : null,
          isPaid && inv.paid_at
            ? `Payée le ${fmtDate(inv.paid_at)}`
            : inv.due_date
            ? `À régler avant le ${fmtDate(inv.due_date)}`
            : inv.issued_at
            ? `Émise le ${fmtDate(inv.issued_at)}`
            : null,
        ].filter(Boolean).join(' · ');

        return (
          <DocRow
            key={inv.id}
            icon={CreditCard}
            iconColor={isPaid ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b'}
            title={label}
            subtitle={sub || null}
            url={inv.pay_url}
            badge={badge}
            badgeColor={badgeColor}
            payUrl={payVisible ? inv.pay_url : null}
          />
        );
      })}

      {/* Résumé paiements si plusieurs factures */}
      {data.invoices?.length > 0 && (() => {
        const total    = data.quote?.total || 0;
        const paid     = data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
        const remaining = Math.max(0, total - paid);
        if (remaining <= 0 || total <= 0) return null;
        return (
          <div style={{
            marginTop: 6, padding: '12px 16px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Reste à régler</span>
            <span style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700 }}>{fmtEur(remaining)}</span>
          </div>
        );
      })()}
    </div>
  );
}

export default function SuiviSection({ ev, token }) {
  const [tab, setTab] = useState('apercu');
  const [guests, setGuests]             = useState([]);
  const [playlists, setPlaylists]       = useState([]);
  const [programmeCount, setProgrammeCount] = useState(null);
  const [statsLoaded, setStatsLoaded]   = useState(false);

  const active  = ['accepte', 'confirme', 'termine'].includes(ev.status);
  const annule  = ev.status === 'annule';
  const days    = daysUntil(ev.event_date);

  useEffect(() => {
    if (!active || !token) { setStatsLoaded(true); return; }
    Promise.all([
      fetch(`/api/mon-espace/guests?eventId=${ev.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ guests: [] })),
      fetch(`/api/mon-espace/playlists/${ev.id}`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ playlists: [] })),
      fetch(`/api/mon-espace/programme/${ev.id}`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([gData, pData, prData]) => {
      setGuests(gData.guests || []);
      setPlaylists(pData.playlists || []);
      setProgrammeCount((prData.items || []).length);
      setStatsLoaded(true);
    });
  }, [ev.id, active, token]);

  // Calculs
  const totalGuests    = guests.length;
  const presentGuests  = guests.filter(g => g.attending === true).length;
  const totalAdults    = guests.filter(g => g.attending === true).reduce((s, g) => s + (g.adults_count  || 0), 0);
  const totalChildren  = guests.filter(g => g.attending === true).reduce((s, g) => s + (g.children_count || 0), 0);
  const totalTracks    = playlists.reduce((s, p) => s + (p.playlist_tracks?.length || 0), 0);
  const pendingTotal   = playlists.reduce((s, p) => s + (p.pending_suggestions || 0), 0);

  const TABS = [
    { id: 'apercu',       label: 'Aperçu' },
    { id: 'facturation',  label: 'Facturation' },
  ];

  return (
    <div>
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '24px 28px', marginBottom: 16,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {TABS.map(t => {
            const isAct = t.id === tab;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '7px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: isAct ? 700 : 500,
                fontFamily: 'var(--font-display), sans-serif',
                background: isAct ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.04)',
                color: isAct ? '#b8ef0b' : 'rgba(255,255,255,0.4)',
                borderBottom: isAct ? '2px solid #b8ef0b' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{t.label}</button>
            );
          })}
        </div>

        {tab === 'apercu' && (
          <>
            {/* Compte à rebours */}
            {!annule && ev.event_date && (
              <div style={{
                background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.12)',
                borderRadius: 12, padding: '20px 24px', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }}>
                    {ev.event_type}{ev.venue_city ? ` · ${ev.venue_city}` : ''}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500 }}>
                    {fmtDate(ev.event_date)}
                  </div>
                </div>
                {days !== null && (
                  <div style={{ textAlign: 'right' }}>
                    {days > 0 ? (
                      <>
                        <div style={{
                          fontFamily: 'var(--font-display), sans-serif',
                          fontSize: 36, fontWeight: 800, color: '#b8ef0b', lineHeight: 1,
                        }}>J-{days}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                          {days === 1 ? 'demain !' : `${days} jours`}
                        </div>
                      </>
                    ) : days === 0 ? (
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#b8ef0b' }}>
                        C'est aujourd'hui ! 🎉
                      </div>
                    ) : (
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Événement passé</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            {!annule && (
              <div style={{ marginBottom: 28 }}>
                <Timeline status={ev.status} />
              </div>
            )}

            {annule && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertCircle size={16} color="#ef4444" strokeWidth={1.5} />
                <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>Cet événement a été annulé.</p>
              </div>
            )}

            {/* Stats cards — seulement si actif */}
            {active && statsLoaded && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: 24,
              }}>
                {/* Invités */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Users size={14} color="#b8ef0b" strokeWidth={1.5} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Invités</span>
                  </div>
                  <StatLine label="Invités"     value={totalGuests || '—'} />
                  <StatLine label="Confirmés"   value={presentGuests || '—'} color="#22c55e" />
                  <StatLine label="Adultes"     value={totalAdults || '—'} />
                  <StatLine label="Enfants"     value={totalChildren || '—'} />
                </div>

                {/* Playlists */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Music2 size={14} color="#b8ef0b" strokeWidth={1.5} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Playlists</span>
                  </div>
                  <StatLine label="Titres ajoutés"  value={totalTracks || '—'} />
                  <StatLine label="Playlists"        value={playlists.length || '—'} />
                  {pendingTotal > 0 && (
                    <StatLine label="À valider" value={`${pendingTotal} 🔴`} color="#f59e0b" />
                  )}
                </div>

                {/* Programme */}
                {programmeCount !== null && (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                      <Calendar size={14} color="#b8ef0b" strokeWidth={1.5} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Programme</span>
                    </div>
                    <div style={{ textAlign: 'center', paddingTop: 4 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: programmeCount > 0 ? '#b8ef0b' : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>
                        {programmeCount}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>
                        étape{programmeCount !== 1 ? 's' : ''} planifiée{programmeCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA si pas encore actif */}
            {!active && !annule && (
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '24px 28px', textAlign: 'center', marginBottom: 20,
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

            {/* Message de Myracoustic */}
            {ev.client_message && (
              <div style={{
                background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.15)',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <MessageCircle size={18} strokeWidth={1.5} color="#b8ef0b" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#b8ef0b', fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em' }}>
                    MESSAGE DE MYRACOUSTIC
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                    {ev.client_message}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'facturation' && (
          <FacturationTab ev={ev} token={token} />
        )}
      </div>
    </div>
  );
}
