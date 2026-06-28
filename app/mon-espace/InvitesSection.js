'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, X, Mail, Trash2, RefreshCw, Check, ChevronDown, ChevronUp, BellRing, Send } from 'lucide-react';

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function RSVPBadge({ attending, responded_at }) {
  if (attending === null || attending === undefined) {
    return <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>En attente</span>;
  }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
      background: attending ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color: attending ? '#22c55e' : '#ef4444',
    }}>
      {attending ? 'Présent(e)' : 'Absent(e)'}
      {responded_at && <span style={{ fontWeight: 400, marginLeft: 4 }}>· {fmtDate(responded_at)}</span>}
    </span>
  );
}

function GuestRow({ guest, playlists, token, onDelete, onReinvite, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [maxSongs, setMaxSongs] = useState(guest.max_songs);
  const [savingMax, setSavingMax] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reinviting, setReinviting] = useState(false);

  const handleMaxSongs = async (val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    setMaxSongs(n);
    setSavingMax(true);
    await fetch(`/api/mon-espace/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ maxSongs: n }),
    });
    setSavingMax(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'invitation de ${guest.first_name} ?`)) return;
    setDeleting(true);
    await fetch(`/api/mon-espace/guests/${guest.id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
    });
    onDelete(guest.id);
  };

  const handleReinvite = async () => {
    setReinviting(true);
    await onReinvite(guest);
    setReinviting(false);
  };

  const guestPlaylists = playlists.filter(p => guest.playlist_ids?.includes(p.id));

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, marginBottom: 8, overflow: 'hidden',
    }}>
      <style>{`
        @media (max-width: 640px) {
          .gr-desktop { display: none !important; }
        }
        @media (min-width: 641px) {
          .gr-mobile-dot { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(184,239,11,0.1)', color: '#b8ef0b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>{guest.first_name[0]}</div>

        {/* Nom + email — flex 1 pour prendre tout l'espace dispo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guest.first_name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guest.email}
          </div>
        </div>

        {/* Desktop : RSVP badge + adultes + badges + boutons */}
        <div className="gr-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <RSVPBadge attending={guest.attending} responded_at={guest.responded_at} />
          {guest.attending && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {guest.adults_count > 0 && `${guest.adults_count}A`}
              {guest.children_count > 0 && ` ${guest.children_count}E`}
            </span>
          )}
          {guest.suggestions?.pending > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {guest.suggestions.pending} prop.
            </span>
          )}
          <button onClick={handleReinvite} disabled={reinviting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
            <RefreshCw size={14} style={reinviting ? { animation: 'spin 0.8s linear infinite' } : {}} />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Mobile : point de statut + chevron uniquement */}
        <div className="gr-mobile-dot" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: guest.attending === true ? '#22c55e' : guest.attending === false ? '#ef4444' : 'rgba(255,255,255,0.25)',
          }} />
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Infos RSVP + actions boutons — visible sur mobile dans le panneau déployé */}
          <div className="gr-mobile-dot" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 10 }}>
            <RSVPBadge attending={guest.attending} responded_at={guest.responded_at} />
            {guest.attending && (guest.adults_count > 0 || guest.children_count > 0) && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {guest.adults_count > 0 && `${guest.adults_count} adulte${guest.adults_count > 1 ? 's' : ''}`}
                {guest.children_count > 0 && ` · ${guest.children_count} enfant${guest.children_count > 1 ? 's' : ''}`}
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {guest.suggestions?.pending > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  {guest.suggestions.pending} prop.
                </span>
              )}
              <button onClick={handleReinvite} disabled={reinviting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}>
                <RefreshCw size={14} style={reinviting ? { animation: 'spin 0.8s linear infinite' } : {}} />
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Playlists :</span>
            {guestPlaylists.length
              ? guestPlaylists.map(p => (
                  <span key={p.id} style={{
                    fontSize: 12, padding: '2px 10px', borderRadius: 10,
                    background: 'rgba(184,239,11,0.08)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.2)',
                  }}>{p.name}</span>
                ))
              : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Aucune</span>
            }
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Limite de chansons par playlist :</span>
            <input
              type="number" min={1} max={50} value={maxSongs}
              onChange={e => handleMaxSongs(e.target.value)}
              style={{
                width: 60, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 13, textAlign: 'center',
              }}
            />
            {savingMax && <span style={{ fontSize: 11, color: '#b8ef0b' }}>✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteForm({ playlists, token, eventId, onInvited }) {
  const [open, setOpen]           = useState(false);
  const [email, setEmail]         = useState('');
  const [firstName, setFirstName] = useState('');
  const [selected, setSelected]   = useState([]);
  const [maxSongs, setMaxSongs]   = useState(10);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const send = async () => {
    if (!email || !firstName) { setError('Email et prénom sont requis.'); return; }
    setSending(true); setError('');
    const res = await fetch('/api/mon-espace/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId, email, firstName, playlistIds: selected, maxSongs }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setError(data.error || 'Erreur'); return; }
    setOpen(false); setEmail(''); setFirstName(''); setSelected([]);
    onInvited();
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(184,239,11,0.08)', border: '1px dashed rgba(184,239,11,0.3)',
      borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
      color: '#b8ef0b', fontSize: 13, fontWeight: 600,
      fontFamily: 'var(--font-display), sans-serif', width: '100%', marginTop: 12,
    }}>
      <Plus size={15} /> Inviter quelqu'un
    </button>
  );

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,239,11,0.2)',
      borderRadius: 10, padding: '16px', marginTop: 12,
    }}>
      <style>{`
        @media (max-width: 640px) {
          .inv-fields { flex-direction: column !important; }
        }
      `}</style>
      <div className="inv-fields" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
          placeholder="Prénom *"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit' }} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email *"
          style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit' }} />
      </div>

      {playlists.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>Playlists accessibles :</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {playlists.map(p => (
              <button key={p.id} onClick={() => toggle(p.id)} style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', border: 'none',
                background: selected.includes(p.id) ? 'rgba(184,239,11,0.15)' : 'rgba(255,255,255,0.05)',
                color: selected.includes(p.id) ? '#b8ef0b' : 'rgba(255,255,255,0.4)',
                outline: selected.includes(p.id) ? '1px solid rgba(184,239,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}>{selected.includes(p.id) && '✓ '}{p.name}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Limite de chansons par playlist :</span>
        <input type="number" min={1} max={50} value={maxSongs} onChange={e => setMaxSongs(parseInt(e.target.value) || 10)}
          style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 13, textAlign: 'center' }} />
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={send} disabled={sending} style={{
          background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 8,
          padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
          fontFamily: 'var(--font-display), sans-serif',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Mail size={14} /> {sending ? 'Envoi…' : 'Envoyer l\'invitation'}
        </button>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '8px 10px' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Panneau Relances RSVP ──────────────────────────────────────── */
function RsvpReminderPanel({ ev, token, pendingCount, onReloaded }) {
  const [enabled, setEnabled] = useState(ev.rsvp_reminder_enabled !== false);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await fetch(`/api/mon-espace/rsvp-reminders/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ enabled: next }),
    });
  };

  const relanceNow = async () => {
    if (pendingCount === 0 || busy) return;
    if (!confirm(`Envoyer une relance à ${pendingCount} invité${pendingCount > 1 ? 's' : ''} sans réponse ?`)) return;
    setBusy(true); setMsg('');
    const res  = await fetch(`/api/mon-espace/rsvp-reminders/${ev.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Relance envoyée à ${data.sent} invité${data.sent > 1 ? 's' : ''}.` : (data.error || 'Erreur'));
    onReloaded?.();
  };

  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BellRing size={16} color="#b8ef0b" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-display), sans-serif' }}>Relances RSVP</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {pendingCount > 0 ? `${pendingCount} invité${pendingCount > 1 ? 's' : ''} sans réponse` : 'Tout le monde a répondu'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={toggle} title="Relance automatique 7 jours après l'invitation, une seule fois" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: enabled ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${enabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
            color: enabled ? '#22c55e' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600,
            fontFamily: 'var(--font-display), sans-serif',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
            Auto {enabled ? 'activée' : 'désactivée'}
          </button>
          <button onClick={relanceNow} disabled={busy || pendingCount === 0} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: pendingCount === 0 ? 'rgba(255,255,255,0.05)' : '#b8ef0b',
            color: pendingCount === 0 ? 'rgba(255,255,255,0.3)' : '#060e16',
            border: 'none', borderRadius: 8, padding: '8px 14px',
            cursor: pendingCount === 0 ? 'default' : 'pointer',
            fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-display), sans-serif', opacity: busy ? 0.7 : 1,
          }}>
            <Send size={13} /> {busy ? 'Envoi…' : 'Relancer maintenant'}
          </button>
        </div>
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: '#b8ef0b' }}>{msg}</div>}
      <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
        Une relance automatique part 7 jours après l'invitation aux invités sans réponse (une seule fois). « Relancer maintenant » envoie un rappel immédiat à tous les non-répondants.
      </div>
    </div>
  );
}

export default function InvitesSection({ ev, token }) {
  const [guests,    setGuests]    = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    const [guestsRes, playlistsRes] = await Promise.all([
      fetch(`/api/mon-espace/guests?eventId=${ev.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`/api/mon-espace/playlists/${ev.id}`,      { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    const guestsData    = await guestsRes.json();
    const playlistsData = await playlistsRes.json();
    setGuests(guestsData.guests || []);
    setPlaylists(playlistsData.playlists || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const handleReinvite = async (guest) => {
    await fetch('/api/mon-espace/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        eventId: ev.id, email: guest.email, firstName: guest.first_name,
        playlistIds: guest.playlist_ids, maxSongs: guest.max_songs, reinvite: true,
      }),
    });
  };

  // Statistiques RSVP
  const responded  = guests.filter(g => g.attending !== null && g.attending !== undefined);
  const present    = guests.filter(g => g.attending === true);
  const totalAdults   = present.reduce((s, g) => s + (g.adults_count || 1), 0);
  const totalChildren = present.reduce((s, g) => s + (g.children_count || 0), 0);
  const pendingSuggestions = guests.reduce((s, g) => s + (g.suggestions?.pending || 0), 0);
  const pendingCount = guests.filter(g => (g.attending === null || g.attending === undefined) && g.email).length;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Stats */}
      {guests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Invités', value: guests.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Ont répondu', value: `${responded.length}/${guests.length}`, color: '#b8ef0b' },
            { label: 'Présents', value: present.length, color: '#22c55e' },
            { label: 'Adultes', value: totalAdults, color: 'rgba(255,255,255,0.5)' },
            { label: 'Enfants', value: totalChildren, color: 'rgba(255,255,255,0.5)' },
            ...(pendingSuggestions > 0 ? [{ label: 'Chansons à valider', value: pendingSuggestions, color: '#f59e0b' }] : []),
          ].map(s => (
            <div key={s.label} style={{
              background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '12px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display), sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Relances RSVP */}
      {guests.length > 0 && (
        <RsvpReminderPanel ev={ev} token={token} pendingCount={pendingCount} onReloaded={load} />
      )}

      {/* Liste */}
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '20px 20px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px',
        }}>Liste des invités</h3>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</p>
        ) : guests.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' }}>
            Aucun invité pour l'instant.
          </p>
        ) : (
          guests.map(g => (
            <GuestRow
              key={g.id} guest={g} playlists={playlists} token={token}
              onDelete={id => setGuests(prev => prev.filter(x => x.id !== id))}
              onReinvite={handleReinvite}
              onUpdate={updated => setGuests(prev => prev.map(x => x.id === updated.id ? updated : x))}
            />
          ))
        )}

        <InviteForm playlists={playlists} token={token} eventId={ev.id} onInvited={load} />
      </div>
    </div>
  );
}
