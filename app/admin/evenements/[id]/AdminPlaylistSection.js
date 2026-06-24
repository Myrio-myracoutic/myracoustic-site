'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Music2, RefreshCw, Download, Wifi, WifiOff, ChevronDown, ChevronUp, Loader2, ExternalLink, Play, Pause, Trash2, Gift, User } from 'lucide-react';

function fmtExpiry(expiresIn) {
  if (!expiresIn) return '';
  const h = Math.floor(expiresIn / 3600);
  const m = Math.floor((expiresIn % 3600) / 60);
  if (h > 0) return `expire dans ${h}h${m > 0 ? m + 'm' : ''}`;
  return `expire dans ${m}min`;
}

function TidalStatus({ status, onConnect }) {
  if (!status) return null;
  const connected = status.connected;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 20, padding: '4px 12px',
      }}>
        {connected
          ? <Wifi size={12} color="#22c55e" />
          : <WifiOff size={12} color="rgba(255,255,255,0.3)" />
        }
        <span style={{ fontSize: 12, color: connected ? '#22c55e' : 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
          {connected ? `Tidal connecté${status.expiresIn ? ' · ' + fmtExpiry(status.expiresIn) : ''}` : 'Tidal non connecté'}
        </span>
      </div>
      {!connected && (
        <a href="/api/admin/tidal/connect" style={{
          background: '#b8ef0b', color: '#060e16',
          borderRadius: 8, padding: '5px 14px',
          fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <ExternalLink size={11} /> Connecter Tidal
        </a>
      )}
    </div>
  );
}

function PlaylistRow({ playlist, playingId, loadingId, onPlay, onDeleteTidal }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tracks = playlist.playlist_tracks || [];
  const tidalCount = tracks.filter(t => t.tidal_id).length;

  const handleDeleteTidal = async () => {
    if (!confirm(`Supprimer la playlist Tidal "${playlist.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/playlists/${playlist.id}/tidal`, { method: 'DELETE' });
    setDeleting(false);
    onDeleteTidal();
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, overflow: 'hidden', marginBottom: 8,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textAlign: 'left',
        }}
      >
        {playlist.is_surprise
          ? <Gift size={14} color="#a78bfa" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          : <Music2 size={14} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0 }} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
            {playlist.name}
          </span>
          {playlist.is_surprise && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#a78bfa',
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 4, padding: '1px 6px', verticalAlign: 'middle',
            }}>SURPRISE</span>
          )}
          {playlist.created_by_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <User size={10} color="rgba(255,255,255,0.25)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{playlist.created_by_name}</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginRight: 4, flexShrink: 0 }}>
          {tracks.length} titre{tracks.length !== 1 ? 's' : ''}
          {tracks.length > 0 && (
            <span style={{ marginLeft: 6, color: tidalCount === tracks.length ? '#22c55e' : tidalCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
              · {tidalCount}/{tracks.length} Tidal
            </span>
          )}
        </span>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {playlist.tidal_playlist_id && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 4px', flexWrap: 'wrap' }}>
              <a
                href={`https://tidal.com/playlist/${playlist.tidal_playlist_id}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)',
                  color: '#b8ef0b', borderRadius: 7, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  fontFamily: 'var(--font-display), sans-serif',
                }}
              >
                <ExternalLink size={12} /> Ouvrir la playlist Tidal
              </a>
              <button
                onClick={handleDeleteTidal}
                disabled={deleting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#ef4444', borderRadius: 7, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display), sans-serif',
                }}
              >
                {deleting
                  ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Trash2 size={12} />
                }
                {deleting ? 'Suppression…' : 'Supprimer de Tidal'}
              </button>
            </div>
          )}
          {tracks.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: '12px 0 0', fontStyle: 'italic' }}>
              Aucun titre ajouté par le client.
            </p>
          ) : (
            tracks.map(track => (
              <div key={track.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <button
                  onClick={() => onPlay(track)}
                  title="Écouter un extrait"
                  style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: 'none',
                    cursor: 'pointer',
                    background: playingId === track.id ? '#b8ef0b' : 'rgba(184,239,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {loadingId === track.id
                    ? <Loader2 size={12} color="#b8ef0b" style={{ animation: 'spin 0.8s linear infinite' }} />
                    : playingId === track.id
                      ? <Pause size={11} color="#060e16" fill="#060e16" />
                      : <Play size={11} color="#b8ef0b" fill="#b8ef0b" style={{ marginLeft: 1 }} />
                  }
                </button>
                {track.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.cover_url} alt="" width={30} height={30}
                    style={{ borderRadius: 5, flexShrink: 0, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{track.title}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginLeft: 8 }}>{track.artist}</span>
                  {track.album && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginLeft: 8 }}>· {track.album}</span>}
                  {track.note && (
                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>
                      {track.note}
                    </span>
                  )}
                </div>
                {track.tidal_id && (
                  <a
                    href={`https://tidal.com/browse/track/${track.tidal_id}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(184,239,11,0.4)', flexShrink: 0 }}
                    title="Voir sur Tidal"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPlaylistSection({ eventId }) {
  const [playlists, setPlaylists]   = useState([]);
  const [tidalStatus, setTidalStatus] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [exporting, setExporting]   = useState(false);
  const [playingId, setPlayingId]   = useState(null);
  const [loadingId, setLoadingId]   = useState(null);
  const audioRef = useRef(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  }, []);

  // Joue un extrait 30s en relançant une recherche Deezer du titre
  // (les titres ne stockent pas l'URL d'extrait).
  const playTrack = useCallback(async (track) => {
    if (playingId === track.id) { stopAudio(); return; }
    stopAudio();

    // Résout un extrait frais (les URLs Deezer expirent) : par id exact
    // si connu, sinon par recherche du titre.
    setLoadingId(track.id);
    let preview = '';
    try {
      const params = track.deezer_id
        ? `deezer_id=${encodeURIComponent(track.deezer_id)}`
        : `q=${encodeURIComponent(`${track.title} ${track.artist}`.trim())}`;
      const res  = await fetch(`/api/music/preview?${params}`);
      const data = await res.json();
      preview = data.preview;
    } catch {}
    setLoadingId(null);

    if (!preview) return;
    const audio = new Audio(preview);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(track.id);
  }, [playingId, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const load = useCallback(async () => {
    const [plRes, stRes] = await Promise.all([
      fetch(`/api/admin/playlists/export/${eventId}?check=1`).catch(() => null),
      fetch('/api/admin/tidal/status'),
    ]);

    // Playlists via la route events
    const evRes = await fetch(`/api/admin/events/${eventId}/playlists`);
    if (evRes.ok) {
      const d = await evRes.json();
      setPlaylists(d.playlists || []);
    }

    if (stRes.ok) setTidalStatus(await stRes.json());
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res  = await fetch(`/api/admin/playlists/sync/${eventId}`, { method: 'POST' });
    const data = await res.json();
    setSyncResult(data);
    setSyncing(false);
    load();
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await fetch(`/api/admin/playlists/export/${eventId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'playlist.m3u';
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  if (loading) return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '24px 28px', marginTop: 20,
      display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 13,
    }}>
      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
      Chargement des playlists…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (playlists.length === 0) return null;

  const totalTracks  = playlists.reduce((s, p) => s + (p.playlist_tracks?.length || 0), 0);
  const tidalTracks  = playlists.reduce((s, p) => s + (p.playlist_tracks || []).filter(t => t.tidal_id).length, 0);
  const coverage     = totalTracks > 0 ? Math.round((tidalTracks / totalTracks) * 100) : 0;

  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '24px 28px', marginTop: 20,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px',
          }}>Playlists du client</h2>
          <TidalStatus status={tidalStatus} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleSync}
            disabled={syncing || !tidalStatus?.connected}
            title={!tidalStatus?.connected ? 'Connectez Tidal d\'abord' : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: tidalStatus?.connected ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tidalStatus?.connected ? 'rgba(184,239,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: tidalStatus?.connected ? '#b8ef0b' : 'rgba(255,255,255,0.25)',
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
              cursor: tidalStatus?.connected && !syncing ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            <RefreshCw size={13} style={syncing ? { animation: 'spin 0.8s linear infinite' } : {}} />
            {syncing ? 'Sync…' : 'Syncer Tidal'}
          </button>

          <button
            onClick={handleExport}
            disabled={exporting || totalTracks === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
              cursor: !exporting && totalTracks > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            <Download size={13} />
            {exporting ? 'Export…' : 'Exporter M3U'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 20, paddingBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Playlists', value: playlists.length },
          { label: 'Titres total', value: totalTracks },
          { label: 'Identifiés Tidal', value: `${tidalTracks} (${coverage}%)`, color: coverage === 100 ? '#22c55e' : coverage > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color || '#fff', fontFamily: 'var(--font-display), sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Résultat sync */}
      {syncResult && (
        <div style={{
          marginBottom: 16, background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 16px',
        }}>
          {(syncResult.results || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              <span style={{ color: r.status === 'synced' ? '#22c55e' : '#ef4444' }}>
                {r.status === 'synced' ? '✓' : '✗'}
              </span>
              {r.playlist} {r.status === 'synced'
                ? `— ${r.total} titre${r.total !== 1 ? 's' : ''} sur Tidal${r.added ? `, +${r.added}` : ''}${r.removed ? `, −${r.removed}` : ''}${r.tracksMissing ? `, ${r.tracksMissing} introuvable${r.tracksMissing !== 1 ? 's' : ''}` : ''}`
                : `— ${r.error || 'erreur'}`}
            </div>
          ))}
        </div>
      )}

      {/* Liste des playlists */}
      {playlists.map(pl => (
        <PlaylistRow key={pl.id} playlist={pl} playingId={playingId} loadingId={loadingId} onPlay={playTrack} onDeleteTidal={load} />
      ))}
    </div>
  );
}
