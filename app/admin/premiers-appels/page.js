'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCall } from 'lucide-react';
import CallSlotModal from '@/app/components/CallSlotModal';

const PATCH_URL = {
  mariage: '/api/admin/mariage-leads',
  devis: '/api/admin/qonto-quotes',
  pro_contact: '/api/admin/pro-contacts',
};

const VERTICAL_BADGE = {
  mariage: { label: 'Mariage', color: 'var(--lime)' },
  particulier: { label: 'Particulier', color: '#f2b84b' },
  professionnel: { label: 'Pro', color: 'var(--indigo-vif)' },
};

function fmtCallDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} j`;
}

/* Même style de contrôles que sur /admin/leads-mariage et /admin/prospects — pattern dupliqué
   volontairement (pas un composant partagé), voir plan du 19/08. */
function CallControls({ scheduledAt, cancelledAt, busy, onSchedule, onReschedule, onCancel }) {
  if (scheduledAt && !cancelledAt) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onReschedule} style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>Modifier</button>
        <button onClick={onCancel} disabled={busy} style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 8, padding: '6px 14px', cursor: busy ? 'wait' : 'pointer', fontSize: 12, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap', opacity: busy ? 0.6 : 1 }}>Annuler</button>
      </div>
    );
  }
  return (
    <button onClick={onSchedule} style={{ border: '1px solid rgba(184,239,11,0.35)', background: 'rgba(184,239,11,0.08)', color: 'var(--lime)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <PhoneCall size={13} /> Programmer un appel
    </button>
  );
}

export default function PremiersAppelsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callBusy, setCallBusy] = useState(null);
  const [callSlotFor, setCallSlotFor] = useState(null);

  const load = () => {
    fetch('/api/admin/premiers-appels')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setRows(d.rows || []); setLoading(false); } });
  };
  useEffect(load, []);

  const cancelCall = async (row) => {
    if (!confirm('Annuler ce rendez-vous téléphonique ?')) return;
    setCallBusy('cancel-' + row.id);
    const res = await fetch(PATCH_URL[row.kind], {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, cancelCall: true }),
    });
    setCallBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    load();
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
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Premiers appels
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          {rows.length} contact{rows.length !== 1 ? 's' : ''} — toutes verticales confondues, triés par urgence. Cliquez sur "Ouvrir le dossier" pour le traitement complet (devis, détail).
        </p>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          Aucun contact pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(row => {
            const badge = VERTICAL_BADGE[row.vertical] || { label: row.vertical, color: 'rgba(255,255,255,0.5)' };
            const hasCall = row.callScheduledAt && !row.callCancelledAt;
            return (
              <div key={`${row.source}-${row.id}`} style={{
                background: '#0d1b2a', border: `1px solid ${hasCall ? 'rgba(184,239,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: badge.color }}>{badge.label}</span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{row.nom || '—'}</div>
                  <div style={{ fontSize: 12.5, color: '#b8ef0b' }}>{row.email}{row.tel ? ` · ${row.tel}` : ''}</div>
                  {hasCall && (
                    <div style={{ fontSize: 11.5, color: 'var(--lime)', fontWeight: 600, marginTop: 2 }}>
                      📞 Appel prévu le {fmtCallDateTime(row.callScheduledAt)}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(row.dateActivite)}</div>
                <a href={row.lienDossier} style={{
                  fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '6px 12px', fontFamily: 'var(--font-display), sans-serif',
                }}>Ouvrir le dossier →</a>
                <CallControls
                  scheduledAt={row.callScheduledAt}
                  cancelledAt={row.callCancelledAt}
                  busy={callBusy === 'cancel-' + row.id}
                  onSchedule={() => setCallSlotFor({ row, mode: 'schedule' })}
                  onReschedule={() => setCallSlotFor({ row, mode: 'reschedule' })}
                  onCancel={() => cancelCall(row)}
                />
              </div>
            );
          })}
        </div>
      )}

      {callSlotFor && (
        <CallSlotModal
          id={callSlotFor.row.id}
          mode={callSlotFor.mode}
          contactLabel={`${callSlotFor.row.nom} · 📞 ${callSlotFor.row.tel || '—'}`}
          patchUrl={PATCH_URL[callSlotFor.row.kind]}
          onClose={() => setCallSlotFor(null)}
          onDone={() => { setCallSlotFor(null); load(); }}
        />
      )}
    </div>
  );
}
