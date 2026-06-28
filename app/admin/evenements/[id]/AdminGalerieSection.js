'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Eye, EyeOff, Upload, Trash2, Loader, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminGalerieSection({ eventId }) {
  const [photos,    setPhotos]    = useState([]);
  const [published, setPublished] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/admin/events/${eventId}/gallery`);
    const data = await res.json();
    setPhotos(data.photos || []);
    setPublished(!!data.published);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    const res  = await fetch(`/api/admin/events/${eventId}/gallery`, { method: 'POST', body: form });
    const data = await res.json();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (data.errors?.length) alert('Certains fichiers ont échoué :\n' + data.errors.join('\n'));
    load();
  };

  const togglePublish = async () => {
    const next = !published;
    setPublished(next);
    await fetch(`/api/admin/events/${eventId}/gallery`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    });
  };

  const remove = async (photoId) => {
    if (!confirm('Supprimer cette photo ?')) return;
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    await fetch(`/api/admin/events/${eventId}/gallery?photoId=${photoId}`, { method: 'DELETE' });
  };

  if (loading) return null;

  return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.07)', marginTop: 20 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={15} color="#b8ef0b" />
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Galerie photos</h2>
          <span style={{ fontSize: 10, background: 'rgba(184,239,11,0.12)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{photos.length}</span>
          {published && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>Publiée</span>}
        </div>
        {open ? <ChevronUp size={15} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.3)" />}
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.3)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#b8ef0b', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' }}>
              {uploading ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Upload size={14} />}
              {uploading ? 'Envoi…' : 'Ajouter des photos'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
            <button onClick={togglePublish} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: published ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${published ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: published ? '#22c55e' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display), sans-serif' }}>
              {published ? <Eye size={14} /> : <EyeOff size={14} />}
              {published ? 'Visible (couple + invités)' : 'Masquée'}
            </button>
          </div>

          {photos.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Aucune photo. Ajoutez les clichés de l'événement.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={p.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => remove(p.id)} title="Supprimer" style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            Téléversez les photos puis activez « Visible » pour les partager avec le couple et ses invités. Astuce : compressez en HD web pour limiter le stockage.
          </p>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
