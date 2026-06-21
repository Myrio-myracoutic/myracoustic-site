'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell({ eventId, token, onNavigate }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen]     = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const bellRef = useRef(null);

  const load = useCallback(async () => {
    if (!eventId || !token) return;
    try {
      const res  = await fetch(`/api/mon-espace/notifications?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifs(data.notifications || []);
    } catch {}
  }, [eventId, token]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOpen = () => {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const dropW = 264;
      let left = rect.right - dropW;
      if (left < 8) left = 8;
      setDropStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: dropW,
        zIndex: 9999,
      });
    }
    setOpen(o => !o);
  };

  const total = notifs.reduce((s, n) => s + n.count, 0);

  return (
    <div ref={bellRef} style={{ display: 'inline-flex', position: 'relative' }}>
      <button
        onClick={toggleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
        }}
      >
        <Bell
          size={16}
          color={total > 0 ? '#f59e0b' : 'rgba(255,255,255,0.4)'}
          strokeWidth={1.5}
        />
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', minWidth: 17, height: 17,
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #060e16',
            fontFamily: 'var(--font-display), sans-serif',
            padding: '0 3px',
            lineHeight: 1,
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          ...dropStyle,
          background: '#0d1b2a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '11px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Notifications
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: '16px 16px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Aucune notification en cours
            </div>
          ) : (
            <>
              {notifs.map(n => (
                <button
                  key={n.playlistId}
                  onClick={() => { onNavigate('playlist'); setOpen(false); }}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{
                    background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '50%', width: 30, height: 30, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    fontFamily: 'var(--font-display), sans-serif',
                  }}>
                    {n.count}
                  </span>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                      {n.count} proposition{n.count > 1 ? 's' : ''} à valider
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                      Playlist · {n.playlistName}
                    </div>
                  </div>
                </button>
              ))}
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => { onNavigate('playlist'); setOpen(false); }}
                  style={{
                    width: '100%', background: 'rgba(184,239,11,0.08)',
                    border: '1px solid rgba(184,239,11,0.2)',
                    borderRadius: 7, padding: '8px 0', cursor: 'pointer',
                    color: '#b8ef0b', fontSize: 12, fontWeight: 700,
                    fontFamily: 'var(--font-display), sans-serif',
                  }}
                >
                  Aller aux playlists →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
