'use client';
import { useEffect, useState, useCallback } from 'react';

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '10px 16px',
      textAlign: 'center',
      minWidth: 72,
    }}>
      <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminGuestSection({ eventId }) {
  const [guests, setGuests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', email: '', playlistIds: [], maxSongs: 10 });
  const [saving, setSaving] = useState(false);
  const [reinviting, setReinviting] = useState(null);

  const load = useCallback(async () => {
    const [gRes, sRes, pRes] = await Promise.all([
      fetch(`/api/admin/events/${eventId}/guests`),
      fetch(`/api/admin/events/${eventId}/suggestions`),
      fetch(`/api/admin/events/${eventId}/playlists`),
    ]);
    const [gData, sData, pData] = await Promise.all([gRes.json(), sRes.json(), pRes.json()]);
    setGuests(gData.guests || []);
    setSuggestions(sData.suggestions || []);
    setPlaylists(pData.playlists || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const total     = guests.length;
  const answered  = guests.filter(g => g.attending !== null).length;
  const present   = guests.filter(g => g.attending === true).length;
  const adults    = guests.filter(g => g.attending === true).reduce((s, g) => s + (g.adults_count || 0), 0);
  const children  = guests.filter(g => g.attending === true).reduce((s, g) => s + (g.children_count || 0), 0);
  const pendingCt = suggestions.filter(s => s.status === 'pending').length;

  const handleInvite = async (reinviteGuest) => {
    if (reinviteGuest) {
      setReinviting(reinviteGuest.id);
    } else {
      setSaving(true);
    }
    const payload = reinviteGuest
      ? { email: reinviteGuest.email, firstName: reinviteGuest.first_name, playlistIds: reinviteGuest.playlist_ids, maxSongs: reinviteGuest.max_songs }
      : { email: form.email, firstName: form.firstName, playlistIds: form.playlistIds, maxSongs: form.maxSongs };

    const res = await fetch(`/api/admin/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await load();
      if (!reinviteGuest) {
        setForm({ firstName: '', email: '', playlistIds: [], maxSongs: 10 });
        setShowForm(false);
      }
    }
    setReinviting(null);
    setSaving(false);
  };

  const handleDelete = async (guestId) => {
    if (!confirm('Supprimer cet invité et toutes ses propositions ?')) return;
    await fetch(`/api/admin/events/${eventId}/guests/${guestId}`, { method: 'DELETE' });
    await load();
  };

  const handleSuggestion = async (suggestionId, action) => {
    await fetch(`/api/admin/events/${eventId}/suggestions/${suggestionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  if (loading) return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)', marginTop: 20 }}>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Chargement…</div>
    </div>
  );

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)', marginTop: 20 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>Invités</h2>
        <button onClick={() => setShowForm(f => !f)} style={{
          background: showForm ? 'rgba(255,255,255,0.06)' : '#b8ef0b',
          color: showForm ? 'rgba(255,255,255,0.6)' : '#060e16',
          border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif',
        }}>
          {showForm ? 'Annuler' : '+ Ajouter un invité'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatBadge label="Invités"     value={total}    color="rgba(255,255,255,0.55)" />
        <StatBadge label="Répondu"     value={answered} color="#f59e0b" />
        <StatBadge label="Présents"    value={present}  color="#22c55e" />
        <StatBadge label="Adultes"     value={adults}   color="#b8ef0b" />
        <StatBadge label="Enfants"     value={children} color="#b8ef0b" />
        {pendingCt > 0 && <StatBadge label="À valider" value={pendingCt} color="#ef4444" />}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '18px 20px', marginBottom: 24,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <input
              placeholder="Prénom"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {playlists.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 8 }}>Playlists accessibles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {playlists.map(pl => {
                  const sel = form.playlistIds.includes(pl.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => setForm(f => ({
                        ...f,
                        playlistIds: sel
                          ? f.playlistIds.filter(id => id !== pl.id)
                          : [...f.playlistIds, pl.id],
                      }))}
                      style={{
                        background: sel ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sel ? 'rgba(184,239,11,0.35)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 16, padding: '4px 12px',
                        color: sel ? '#b8ef0b' : 'rgba(255,255,255,0.45)',
                        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {pl.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Max. chansons</label>
              <input
                type="number" min={1} max={50}
                value={form.maxSongs}
                onChange={e => setForm(f => ({ ...f, maxSongs: +e.target.value }))}
                style={{ ...inputStyle, width: 68, padding: '8px 10px' }}
              />
            </div>
            <button
              onClick={() => handleInvite(null)}
              disabled={saving || !form.firstName.trim() || !form.email.trim()}
              style={{
                background: '#b8ef0b', color: '#060e16', border: 'none',
                borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display), sans-serif',
                opacity: (!form.firstName.trim() || !form.email.trim()) ? 0.5 : 1,
              }}
            >
              {saving ? 'Envoi…' : 'Inviter'}
            </button>
          </div>
        </div>
      )}

      {/* Propositions à valider */}
      {pendingSuggestions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Propositions à valider</span>
            <span style={{
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
            }}>{pendingSuggestions.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingSuggestions.map(s => {
              const pl = playlists.find(p => p.id === s.playlist_id);
              return (
                <div key={s.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {s.cover_url && (
                    <img src={s.cover_url} alt="" style={{ width: 36, height: 36, borderRadius: 4, flexShrink: 0, objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                      {s.artist}
                      {s.event_guests?.first_name && (
                        <span style={{ color: 'rgba(255,255,255,0.22)' }}> · par {s.event_guests.first_name}</span>
                      )}
                      {pl && (
                        <span style={{ color: 'rgba(255,255,255,0.22)' }}> · {pl.name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleSuggestion(s.id, 'approve')} style={approveBtn}>✓ Approuver</button>
                    <button onClick={() => handleSuggestion(s.id, 'reject')} style={rejectBtn}>✕ Rejeter</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des invités */}
      {guests.length > 0 ? (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 12 }}>
            Liste des invités
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {guests.map(g => {
              const rsvp = g.attending === true
                ? { label: `Présent(e) · ${g.adults_count || 0}A ${g.children_count || 0}E`, color: '#22c55e' }
                : g.attending === false
                ? { label: 'Absent(e)', color: '#ef4444' }
                : { label: 'En attente', color: '#f59e0b' };

              return (
                <div key={g.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>{g.first_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{g.email}</div>
                  </div>

                  <span style={{
                    background: `${rsvp.color}15`, color: rsvp.color,
                    border: `1px solid ${rsvp.color}40`,
                    borderRadius: 16, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}>
                    {rsvp.label}
                  </span>

                  {(g.suggestions.pending > 0 || g.suggestions.approved > 0) && (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, flexShrink: 0 }}>
                      {g.suggestions.pending > 0 && (
                        <span style={{ color: '#f59e0b' }}>{g.suggestions.pending} att. </span>
                      )}
                      {g.suggestions.approved > 0 && (
                        <span style={{ color: '#22c55e' }}>{g.suggestions.approved} app.</span>
                      )}
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleInvite(g)}
                      disabled={reinviting === g.id}
                      style={{
                        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 7, padding: '5px 10px', fontSize: 11,
                        cursor: 'pointer', fontFamily: 'inherit',
                        opacity: reinviting === g.id ? 0.5 : 1,
                      }}
                    >
                      {reinviting === g.id ? '…' : 'Ré-inviter'}
                    </button>
                    <button onClick={() => handleDelete(g.id)} style={rejectBtnSm}>
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !showForm && (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Aucun invité pour cet événement
          </div>
        )
      )}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 12px',
  color: '#fff', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

const approveBtn = {
  background: 'rgba(34,197,94,0.1)', color: '#22c55e',
  border: '1px solid rgba(34,197,94,0.25)',
  borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};

const rejectBtn = {
  background: 'rgba(239,68,68,0.08)', color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.22)',
  borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};

const rejectBtnSm = {
  background: 'rgba(239,68,68,0.07)', color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.18)',
  borderRadius: 7, padding: '5px 10px', fontSize: 11,
  cursor: 'pointer', fontFamily: 'inherit',
};
