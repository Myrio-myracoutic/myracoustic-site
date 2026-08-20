'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Mail, MousePointerClick, Send, FileText, ChevronDown, ExternalLink, PhoneCall } from 'lucide-react';
import CallSlotModal from '@/app/components/CallSlotModal';

const QUOTE_STATUS_LABEL = {
  pending_approval: { label: 'En attente', color: '#f59e0b' },
  approved:          { label: 'Accepté',   color: '#22c55e' },
  canceled:          { label: 'Annulé',    color: 'rgba(255,255,255,0.35)' },
};

const STEP_LABELS = ['Calendrier', 'Identité', 'Événement', 'Prestations', 'Facturation', 'Récapitulatif'];
const TOTAL_STEPS = 5;

const MATERIAL_LABEL = { true: 'Myracoustic fournit le matériel', false: 'Matériel déjà sur place' };
const VIDEO_LABEL = {
  none: 'Aucune', projecteur: 'Projecteur / écran', led: 'Écran LED',
  ecran: 'Écran', mapping: 'Mapping vidéo',
};
const ECLAIR_LABEL = {
  archi: 'Mise en lumière de la salle',
  fumee: 'Machine à fumée',
  etincelles: 'Étincelles froides',
};

/* ── Panneau détail du devis en cours ──────────────────────────── */
function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{value}</span>
    </div>
  );
}

function DetailGroup({ title, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!items || (Array.isArray(items) && items.length === 0)) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#b8ef0b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{title}</p>
      {children}
    </div>
  );
}

function ProspectDetail({ d }) {
  const eclairs = Object.entries(d.eclairOpts || {}).filter(([, v]) => v).map(([k]) => ECLAIR_LABEL[k] || k);
  const fmtFullDate = (x) => x ? new Date(x + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const lieuComplet = [d.adresse, d.cp, d.ville].filter(Boolean).join(', ');

  return (
    <div style={{
      marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24,
    }}>
      <div>
        <DetailGroup title="Identité">
          <DetailRow label="Prénom / Nom" value={`${d.prenom || ''} ${d.nom || ''}`.trim()} />
          <DetailRow label="Téléphone" value={d.tel} />
        </DetailGroup>

        <DetailGroup title="Événement">
          <DetailRow label="Type" value={d.eventType} />
          <DetailRow label="Date" value={fmtFullDate(d.date)} />
          <DetailRow label="Lieu" value={d.lieu} />
          <DetailRow label="Distance" value={d.km ? `${d.km} km` : null} />
          <DetailRow label="Nb de personnes" value={d.nbPersons} />
        </DetailGroup>
      </div>

      <div>
        <DetailGroup title="Prestations">
          <DetailRow label="Animation DJ" value={d.djDuration ? `${d.djDuration} h` : null} />
          <DetailRow label="Matériel" value={d.needsMaterial === null || d.needsMaterial === undefined ? null : MATERIAL_LABEL[d.needsMaterial]} />
          <DetailRow label="Éclairage" value={eclairs.length ? eclairs.join(', ') : null} />
          <DetailRow label="Vidéo" value={d.videoChoice ? (VIDEO_LABEL[d.videoChoice] || d.videoChoice) : null} />
          <DetailRow label="Karaoké" value={d.karaokeActive ? 'Oui' : null} />
        </DetailGroup>

        {lieuComplet && (
          <DetailGroup title="Facturation">
            <DetailRow label="Adresse" value={lieuComplet} />
          </DetailGroup>
        )}
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'il y a moins d\'1h';
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

/* Boutons de planning d'appel — partagés entre les devis Qonto et les contacts pro simples. */
function CallControls({ scheduledAt, cancelledAt, busy, onSchedule, onReschedule, onCancel, onSendLink, sendLinkBusy }) {
  if (scheduledAt && !cancelledAt) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onReschedule} title="Choisir un autre jour/créneau" style={{
          border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12,
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap',
        }}>Modifier</button>
        <button onClick={onCancel} disabled={busy} title="Annuler le rendez-vous téléphonique" style={{
          border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444',
          borderRadius: 8, padding: '6px 14px', cursor: busy ? 'wait' : 'pointer', fontSize: 12,
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap',
          opacity: busy ? 0.6 : 1,
        }}>Annuler</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onSchedule} title="Programmer un appel avec ce contact" style={{
        border: '1px solid rgba(184,239,11,0.35)', background: 'rgba(184,239,11,0.08)', color: 'var(--lime)',
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}><PhoneCall size={13} /> Programmer un appel</button>
      {onSendLink && (
        <button onClick={onSendLink} disabled={sendLinkBusy} title="Envoyer un email pour que le contact choisisse lui-même son créneau" style={{
          border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
          borderRadius: 8, padding: '6px 14px', cursor: sendLinkBusy ? 'wait' : 'pointer', fontSize: 12,
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap',
          opacity: sendLinkBusy ? 0.6 : 1,
        }}>Envoyer le lien</button>
      )}
    </div>
  );
}

export default function ProspectsPage() {
  const router    = useRouter();
  const [prospects, setProspects] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(null);
  const [sent,      setSent]      = useState({});
  const [expanded,  setExpanded]  = useState(null);
  const [quotes,    setQuotes]    = useState([]);
  const [proLeads,  setProLeads]  = useState([]);
  const [guideSignups, setGuideSignups] = useState([]);
  const [callBusy,  setCallBusy]  = useState(null);
  const [callSlotFor, setCallSlotFor] = useState(null); // { kind, id, mode, contactLabel, patchUrl }

  const load = () => {
    fetch('/api/admin/prospects')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setProspects(d.prospects || []); setLoading(false); } });
    fetch('/api/admin/qonto-quotes')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setQuotes(d.quotes || []); });
    fetch('/api/admin/pro-contacts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProLeads(d.leads || []); });
    fetch('/api/admin/lead-magnet')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setGuideSignups(d.signups || []); });
  };

  const fmtCallDateTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const cancelCall = async (patchUrl, id) => {
    if (!confirm('Annuler ce rendez-vous téléphonique ?')) return;
    setCallBusy('cancel-' + id);
    const res = await fetch(patchUrl, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, cancelCall: true }),
    });
    setCallBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    load();
  };

  const sendBookingLink = async (patchUrl, id) => {
    setCallBusy('link-' + id);
    const res = await fetch(patchUrl, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, sendBookingLink: true }),
    });
    setCallBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    alert('Email envoyé — le contact peut choisir lui-même son créneau.');
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

  const deleteEntry = async (patchUrl, id, label) => {
    if (!confirm(`Supprimer ${label} ?`)) return;
    await fetch(patchUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const handleRelance = async (email) => {
    setSending(email);
    const res = await fetch('/api/admin/prospects/relance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSending(null);
    if (res.ok) {
      setSent(s => ({ ...s, [email]: true }));
      setTimeout(() => setSent(s => ({ ...s, [email]: false })), 3000);
      load();
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '36px 36px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Prospects</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          {prospects.length} formulaire{prospects.length !== 1 ? 's' : ''} en cours de remplissage
        </p>
      </div>

      {prospects.length === 0 ? (
        <div style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '60px 24px', textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 14,
        }}>
          Aucun prospect en cours actuellement.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {prospects.map(p => {
            const d        = p.data || {};
            const pct      = Math.round((p.step / TOTAL_STEPS) * 100);
            const stepLabel = STEP_LABELS[p.step] || `Étape ${p.step}`;
            const isSending = sending === p.email;
            const wasSent   = sent[p.email];

            return (
              <div key={p.email} style={{
                background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '18px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

                  {/* Identité */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                      {d.prenom || '—'} {d.nom || ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`mailto:${p.email}`} style={{ fontSize: 13, color: '#b8ef0b', textDecoration: 'none' }}>
                        {p.email}
                      </a>
                      {d.tel && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>· {d.tel}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                      Dernière activité {timeAgo(p.updated_at)}
                    </div>

                    {/* Tracking relance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                      {p.last_relance_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          <Send size={10} color="rgba(255,255,255,0.25)" />
                          Relancé le {fmtDateTime(p.last_relance_at)}
                        </div>
                      )}
                      {p.relance_clicked_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#22c55e' }}>
                          <MousePointerClick size={10} color="#22c55e" />
                          A cliqué le {fmtDateTime(p.relance_clicked_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Événement */}
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ÉVÉNEMENT</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{d.eventType || '—'}</div>
                    <div style={{ fontSize: 13, color: '#b8ef0b', fontWeight: 600 }}>{fmtDate(d.date)}</div>
                    {d.lieu && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{d.lieu.split(',').slice(0, 2).join(',')}</div>}
                  </div>

                  {/* Progression */}
                  <div style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>PROGRESSION</span>
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{stepLabel}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 6, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                      Étape {p.step} / {TOTAL_STEPS}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setExpanded(expanded === p.email ? null : p.email)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 7, color: 'rgba(255,255,255,0.6)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'var(--font-display), sans-serif',
                        }}
                      >
                        <FileText size={13} />
                        Voir le devis
                        <ChevronDown size={13} style={{ transform: expanded === p.email ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      <button
                        onClick={() => handleRelance(p.email)}
                        disabled={isSending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                          background: wasSent ? 'rgba(34,197,94,0.1)' : 'rgba(184,239,11,0.08)',
                          border: `1px solid ${wasSent ? 'rgba(34,197,94,0.3)' : 'rgba(184,239,11,0.2)'}`,
                          borderRadius: 7,
                          color: wasSent ? '#22c55e' : '#b8ef0b',
                          fontSize: 12, fontWeight: 600, cursor: isSending ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-display), sans-serif', opacity: isSending ? 0.6 : 1,
                        }}
                      >
                        <Mail size={13} />
                        {isSending ? 'Envoi…' : wasSent ? '✓ Envoyé' : 'Relancer'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.email)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '7px 10px',
                          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: 7, color: '#ef4444', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Panneau détail du devis */}
                {expanded === p.email && <ProspectDetail d={d} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Devis Qonto (tunnel particulier) ─────────────────────────
          Brouillons à finaliser + devis envoyés, avec statut réel (vérifié
          toutes les 10 min — Qonto n'a pas de webhook pour les devis). */}
      <div style={{ marginTop: 44, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Devis Qonto (particulier)
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {quotes.length} devis suivi{quotes.length !== 1 ? 's' : ''} — brouillons à finaliser et statut réel des devis envoyés.
        </p>
      </div>

      {quotes.length === 0 ? (
        <div style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 14,
        }}>
          Aucun devis Qonto suivi pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {quotes.map(q => {
            const st = QUOTE_STATUS_LABEL[q.qonto_status] || { label: q.qonto_status, color: 'rgba(255,255,255,0.4)' };
            const needsAction = q.kind === 'brouillon' && q.qonto_status === 'pending_approval';
            return (
              <div key={q.id} style={{
                background: '#0d1b2a',
                border: `1px solid ${needsAction ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {q.client_first_name || ''} {q.client_last_name || ''}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#b8ef0b' }}>{q.client_email}</div>
                  {q.call_scheduled_at && !q.call_cancelled_at && (
                    <div style={{ fontSize: 11.5, color: 'var(--lime)', fontWeight: 600, marginTop: 2 }}>
                      📞 Appel prévu le {fmtCallDateTime(q.call_scheduled_at)}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{q.event_type || '—'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{fmtDate(q.event_date)}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  background: needsAction ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                  color: needsAction ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                }}>
                  {q.kind === 'brouillon' ? 'Brouillon à finaliser' : 'Envoyé au client'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>
                  {st.label}
                </span>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                  {timeAgo(q.created_at)}
                </div>
                {q.qonto_quote_url && (
                  <a href={q.qonto_quote_url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 7, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif',
                  }}>
                    <ExternalLink size={12} /> Ouvrir dans Qonto
                  </a>
                )}
                <CallControls
                  scheduledAt={q.call_scheduled_at}
                  cancelledAt={q.call_cancelled_at}
                  busy={callBusy === 'cancel-' + q.id}
                  onSchedule={() => setCallSlotFor({ kind: 'devis', id: q.id, mode: 'schedule', contactLabel: `${q.client_first_name || ''} ${q.client_last_name || ''} · 📞 ${q.client_phone || '—'}`, patchUrl: '/api/admin/qonto-quotes' })}
                  onReschedule={() => setCallSlotFor({ kind: 'devis', id: q.id, mode: 'reschedule', contactLabel: `${q.client_first_name || ''} ${q.client_last_name || ''} · 📞 ${q.client_phone || '—'}`, patchUrl: '/api/admin/qonto-quotes' })}
                  onCancel={() => cancelCall('/api/admin/qonto-quotes', q.id)}
                  onSendLink={() => sendBookingLink('/api/admin/qonto-quotes', q.id)}
                  sendLinkBusy={callBusy === 'link-' + q.id}
                />
                <button
                  onClick={() => deleteEntry('/api/admin/qonto-quotes', q.id, `le devis de ${q.client_first_name || ''} ${q.client_last_name || ''}`)}
                  title="Supprimer ce suivi de devis"
                  style={{
                    display: 'flex', alignItems: 'center', padding: '7px 10px',
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 7, color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Demandes de contact professionnel (formulaire simple, sans devis) ──── */}
      <div style={{ marginTop: 44, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Demandes de contact professionnel
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {proLeads.length} demande{proLeads.length !== 1 ? 's' : ''} — formulaire de contact pro simple (sans prix affiché).
        </p>
      </div>

      {proLeads.length === 0 ? (
        <div style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 14,
        }}>
          Aucune demande de contact pro pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {proLeads.map(l => (
            <div key={l.id} style={{
              background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {l.prenom} {l.nom} · {l.societe}
                </div>
                <div style={{ fontSize: 12.5, color: '#b8ef0b' }}>{l.email} · 📞 {l.tel}</div>
                {l.call_scheduled_at && !l.call_cancelled_at && (
                  <div style={{ fontSize: 11.5, color: 'var(--lime)', fontWeight: 600, marginTop: 2 }}>
                    📞 Appel prévu le {fmtCallDateTime(l.call_scheduled_at)}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{l.event_type || '—'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{l.event_date ? fmtDate(l.event_date) : 'Date non précisée'}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                {timeAgo(l.created_at)}
              </div>
              <CallControls
                scheduledAt={l.call_scheduled_at}
                cancelledAt={l.call_cancelled_at}
                busy={callBusy === 'cancel-' + l.id}
                onSchedule={() => setCallSlotFor({ kind: 'pro_contact', id: l.id, mode: 'schedule', contactLabel: `${l.prenom} ${l.nom} · 📞 ${l.tel}`, patchUrl: '/api/admin/pro-contacts' })}
                onReschedule={() => setCallSlotFor({ kind: 'pro_contact', id: l.id, mode: 'reschedule', contactLabel: `${l.prenom} ${l.nom} · 📞 ${l.tel}`, patchUrl: '/api/admin/pro-contacts' })}
                onCancel={() => cancelCall('/api/admin/pro-contacts', l.id)}
                onSendLink={() => sendBookingLink('/api/admin/pro-contacts', l.id)}
                sendLinkBusy={callBusy === 'link-' + l.id}
              />
              <button
                onClick={() => deleteEntry('/api/admin/pro-contacts', l.id, `la demande de ${l.prenom} ${l.nom}`)}
                title="Supprimer cette demande"
                style={{
                  display: 'flex', alignItems: 'center', padding: '7px 10px',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 7, color: '#ef4444', cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Guide téléchargé (aimant public) ─────────────────────── */}
      <div style={{ marginTop: 44, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Guide téléchargé (aimant public)
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {guideSignups.length} email{guideSignups.length !== 1 ? 's' : ''} capté{guideSignups.length !== 1 ? 's' : ''} via le guide « 7 questions avant de choisir son DJ de mariage ».
        </p>
      </div>

      {guideSignups.length === 0 ? (
        <div style={{
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 14,
        }}>
          Aucun téléchargement pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {guideSignups.map(s => {
            const seqLabel = s.sequence_stopped_at
              ? { label: 'Désinscrit', color: 'rgba(255,255,255,0.35)' }
              : s.sequence_step >= 5
                ? { label: 'Séquence terminée', color: '#22c55e' }
                : { label: `${s.sequence_step}/5 envoyés`, color: 'rgba(255,255,255,0.5)' };
            return (
              <div key={s.id} style={{
                background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {s.first_name || '—'}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#b8ef0b' }}>{s.email}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  Téléchargé {timeAgo(s.created_at)}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: seqLabel.color }}>
                  {seqLabel.label}
                </span>
                <button
                  onClick={() => deleteEntry('/api/admin/lead-magnet', s.id, `la fiche de ${s.first_name || s.email}`)}
                  title="Supprimer cette fiche"
                  style={{
                    display: 'flex', alignItems: 'center', padding: '7px 10px',
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 7, color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {callSlotFor && (
        <CallSlotModal
          id={callSlotFor.id}
          mode={callSlotFor.mode}
          contactLabel={callSlotFor.contactLabel}
          patchUrl={callSlotFor.patchUrl}
          onClose={() => setCallSlotFor(null)}
          onDone={() => { setCallSlotFor(null); load(); }}
        />
      )}
    </div>
  );
}
