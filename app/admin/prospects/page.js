'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Mail } from 'lucide-react';

const STEP_LABELS = ['Calendrier', 'Identité', 'Événement', 'Prestations', 'Facturation', 'Récapitulatif'];
const TOTAL_STEPS = 5;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'il y a moins d\'1h';
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

export default function ProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = () => {
    fetch('/api/admin/prospects')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setProspects(d.prospects || []); setLoading(false); } });
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
            const d   = p.data || {};
            const pct = Math.round((p.step / TOTAL_STEPS) * 100);
            const stepLabel = STEP_LABELS[p.step] || `Étape ${p.step}`;
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
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`mailto:${p.email}?subject=Votre devis Myracoustic&body=Bonjour ${d.prenom || ''},`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                        background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)',
                        borderRadius: 7, color: '#b8ef0b', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif',
                      }}
                    >
                      <Mail size={13} /> Relancer
                    </a>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
