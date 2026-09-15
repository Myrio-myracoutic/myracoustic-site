'use client';
import { useEffect, useState } from 'react';
import { PhoneCall, Send, Loader2 } from 'lucide-react';
import CallSlotModal from '@/app/components/CallSlotModal';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

const btnGhost = {
  border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)',
  borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12.5,
  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
};

/* Les 4 rendez-vous d'accompagnement une fois le client signé (présentation de la plateforme,
   visite du lieu à 6 mois, point à 1 mois, derniers réglages à 2 semaines) — voir
   supabase-migrations/2026-09-14_event_milestones.sql. Remplace, pour un client, l'ancien
   bouton "Programmer un appel" des prospects dans app/admin/leads-mariage/page.js. */
export default function AdminMilestonesSection({ eventId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callSlotFor, setCallSlotFor] = useState(null); // { milestone, mode: 'schedule' | 'reschedule' }
  const [busy, setBusy] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => fetch(`/api/admin/event-milestones?eventId=${eventId}`)
    .then(r => r.json())
    .then(d => { setMilestones(d.milestones || []); setLoading(false); });

  useEffect(() => { load(); }, [eventId]);

  const act = async (id, body, busyKey) => {
    setBusy(busyKey);
    const res = await fetch('/api/admin/event-milestones', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }),
    });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    load();
  };

  const createMilestones = async () => {
    setCreating(true);
    const res = await fetch('/api/admin/event-milestones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }),
    });
    setCreating(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || 'Erreur'); return; }
    load();
  };

  if (loading) return null;

  // Événement créé avant la mise en place du suivi (ou jamais rattrapé) — pas de création
  // automatique, mais Myrio peut le faire lui-même en un clic, sans email envoyé.
  if (!milestones.length) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '20px 24px', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
            Cet événement n'a pas encore de rendez-vous de suivi (créé avant leur mise en place).
          </p>
          <button onClick={createMilestones} disabled={creating} style={{
            border: '1px solid rgba(184,239,11,0.35)', background: 'rgba(184,239,11,0.08)', color: '#b8ef0b',
            borderRadius: 8, padding: '8px 16px', cursor: creating ? 'wait' : 'pointer', fontSize: 13,
            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, whiteSpace: 'nowrap', opacity: creating ? 0.6 : 1,
          }}>{creating ? 'Création…' : 'Créer le suivi'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>
          Rendez-vous de suivi
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {milestones.map(m => {
            const booked = m.call_scheduled_at && !m.call_cancelled_at;
            const key = m.id;
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px',
              }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                  {booked ? (
                    <div style={{ color: '#b8ef0b', fontSize: 12.5 }}>📞 Prévu le {fmtDateTime(m.call_scheduled_at)}</div>
                  ) : m.target_date ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5 }}>À prévoir vers le {fmtDate(m.target_date)}</div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5 }}>À réserver dès que possible</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {booked ? (
                    <button onClick={() => act(m.id, { cancelCall: true }, 'cancel-' + key)} disabled={busy === 'cancel-' + key} title="Annuler ce rendez-vous" style={{ ...btnGhost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                      {busy === 'cancel-' + key ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Annuler'}
                    </button>
                  ) : (
                    <button onClick={() => act(m.id, { sendBookingLink: true }, 'link-' + key)} disabled={busy === 'link-' + key} title="Renvoyer au client le lien pour choisir son créneau" style={btnGhost}>
                      {busy === 'link-' + key ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Send size={13} /> Renvoyer le lien</>}
                    </button>
                  )}
                  <button onClick={() => setCallSlotFor({ milestone: m, mode: booked ? 'reschedule' : 'schedule' })} title="Programmer ce rendez-vous vous-même" style={{ ...btnGhost, color: '#b8ef0b', borderColor: 'rgba(184,239,11,0.3)', background: 'rgba(184,239,11,0.08)' }}>
                    <PhoneCall size={13} /> {booked ? 'Modifier' : 'Programmer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {callSlotFor && (
        <CallSlotModal
          id={callSlotFor.milestone.id}
          mode={callSlotFor.mode}
          contactLabel={callSlotFor.milestone.label}
          patchUrl="/api/admin/event-milestones"
          onClose={() => setCallSlotFor(null)}
          onDone={() => { setCallSlotFor(null); load(); }}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
