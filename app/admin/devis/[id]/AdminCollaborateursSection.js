'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusDot({ collab }) {
  if (collab.accepted_at) {
    return (
      <span title={`Connecté le ${fmtDateTime(collab.accepted_at)}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#22c55e',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        Connecté
      </span>
    );
  }
  if (collab.auth_id) {
    return (
      <span title="Invitation envoyée, pas encore connecté" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#f59e0b',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
        Invité
      </span>
    );
  }
  return (
    <span title="En attente d'invitation" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-block' }} />
      En attente
    </span>
  );
}

export default function AdminCollaborateursSection({ eventId }) {
  const [collabs,    setCollabs]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reinviting, setReinviting] = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/admin/events/${eventId}/collaborateurs`);
    const data = await res.json();
    setCollabs(data.collaborateurs || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleReinvite = async (collab) => {
    setReinviting(collab.id);
    await fetch(`/api/admin/events/${eventId}/collaborateurs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collabId: collab.id }),
    });
    setReinviting(null);
    await load();
  };

  const handleDelete = async (collab) => {
    setDeleting(collab.id);
    await fetch(`/api/admin/events/${eventId}/collaborateurs?collabId=${collab.id}`, {
      method: 'DELETE',
    });
    setConfirmDel(null);
    setDeleting(null);
    await load();
  };

  return (
    <div style={{
      marginTop: 20, background: '#0d1b2a', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
    }}>
      {/* En-tête */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={14} color="rgba(255,255,255,0.3)" />
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>Accès partagé</h2>
          {collabs.length > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.07)', borderRadius: 20,
              padding: '1px 8px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
            }}>{collabs.length}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '28px 24px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</div>
      ) : collabs.length === 0 ? (
        <div style={{ padding: '28px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' }}>
          Aucun accès partagé sur cet événement.
        </div>
      ) : (
        <div>
          {/* Header colonnes */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 80px',
            padding: '10px 24px',
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span>Collaborateur</span>
            <span>Email</span>
            <span>Statut</span>
            <span>Invité le</span>
            <span />
          </div>

          {collabs.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 80px',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < collabs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Nom */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px' }}>
                  {c.first_name} {c.last_name || ''}
                </p>
                {c.last_sign_in_at && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                    Dernière connexion : {fmtDate(c.last_sign_in_at)}
                  </p>
                )}
              </div>

              {/* Email */}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, wordBreak: 'break-all' }}>
                {c.email}
              </p>

              {/* Statut */}
              <div>
                <StatusDot collab={c} />
                {!c.email_confirmed && c.auth_id && (
                  <p style={{ fontSize: 11, color: '#f59e0b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> Email non confirmé
                  </p>
                )}
              </div>

              {/* Date invitation */}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                {fmtDate(c.invited_at) || '—'}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleReinvite(c)}
                  disabled={reinviting === c.id}
                  title="Ré-envoyer l'invitation"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                    color: reinviting === c.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (reinviting !== c.id) { e.currentTarget.style.color = '#b8ef0b'; e.currentTarget.style.borderColor = 'rgba(184,239,11,0.4)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <RefreshCw size={13} style={{ animation: reinviting === c.id ? 'spin 0.8s linear infinite' : 'none' }} />
                </button>
                <button
                  onClick={() => setConfirmDel(c)}
                  title="Révoquer l'accès"
                  style={{
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                    color: 'rgba(239,68,68,0.5)',
                    display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDel && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setConfirmDel(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 400,
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
              Révoquer l'accès ?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{confirmDel.first_name} {confirmDel.last_name || ''}</strong> ({confirmDel.email})
              {' '}ne pourra plus accéder à l'espace client.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDel(null)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 9, padding: '10px', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                disabled={deleting === confirmDel.id}
                style={{
                  flex: 1, background: '#ef4444', border: 'none',
                  borderRadius: 9, padding: '10px', cursor: 'pointer',
                  color: '#fff', fontSize: 14, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
                  opacity: deleting === confirmDel.id ? 0.6 : 1,
                }}
              >
                {deleting === confirmDel.id ? 'Suppression…' : 'Révoquer l\'accès'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
