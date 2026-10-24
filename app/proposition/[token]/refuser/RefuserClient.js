'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle2 } from 'lucide-react';

const RAISONS = [
  { key: 'prix', label: 'Le budget ne correspondait pas' },
  { key: 'offre_mismatch', label: "L'offre ne correspondait pas à ce que j'imaginais" },
  { key: 'autre_prestataire', label: "J'ai choisi un autre prestataire" },
  { key: 'parcours_confus', label: 'Le parcours a été trop long ou confus' },
  { key: 'annule', label: 'Mon mariage est annulé ou reporté' },
  { key: 'sans_suite', label: "Je n'ai plus besoin de prestataire" },
  { key: 'autre', label: 'Autre raison' },
];

const textarea = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14.5, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 80,
};

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', justifyContent: 'center' }}>
        <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} priority />
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px 70px' }}>{children}</div>
    </div>
  );
}

export default function RefuserClient({ token }) {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [raison, setRaison] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/proposition/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setP(d.proposal))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (sending || !raison) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/proposition/${token}/refuser`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raison, commentaire: commentaire.trim() || undefined }),
      });
      setSending(false);
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Une erreur est survenue.'); return; }
      setDone(true);
    } catch {
      setSending(false); setError('La connexion a été interrompue. Réessayez.');
    }
  };

  if (loading) return <Shell><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={30} color="var(--lime)" style={{ animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></Shell>;

  if (notFound || !p) return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Lien introuvable</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7 }}>Contactez-nous au 07 68 53 33 08 si besoin.</p>
      </div>
    </Shell>
  );

  if (p.status === 'validee') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Votre proposition est déjà acceptée</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7 }}>Si vous souhaitez en discuter, appelez-nous au 07 68 53 33 08.</p>
      </div>
    </Shell>
  );

  if (done || p.unavailable === 'refusee') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle2 size={48} color="var(--lime)" style={{ margin: '0 auto 18px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Merci{p.firstName ? ` ${p.firstName}` : ''} pour votre retour</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7 }}>C&apos;est précieux pour nous aider à nous améliorer. Si vous changez d&apos;avis, vous pouvez nous recontacter à tout moment au 07 68 53 33 08.</p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,4vw,28px)', fontWeight: 800, textAlign: 'center', marginBottom: 10 }}>
        {p.firstName ? `${p.firstName}, ` : ''}pourquoi ne pas donner suite ?
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
        Votre réponse nous aide à améliorer notre service. Ça ne prend que 10 secondes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {RAISONS.map(r => (
          <button key={r.key} onClick={() => setRaison(r.key)} style={{
            textAlign: 'left', padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600,
            border: raison === r.key ? '1px solid var(--lime)' : '1px solid rgba(255,255,255,0.12)',
            background: raison === r.key ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.04)',
            color: raison === r.key ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
          }}>
            {r.label}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 }}>
        Un mot de plus ? (facultatif)
      </label>
      <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} style={{ ...textarea, marginBottom: 20 }} placeholder="Dites-nous-en plus si vous le souhaitez…" />

      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 14 }}>{error}</p>}

      <button onClick={submit} disabled={sending || !raison} className="btn-primary" style={{
        width: '100%', justifyContent: 'center', opacity: sending || !raison ? 0.5 : 1, cursor: sending || !raison ? 'not-allowed' : 'pointer',
      }}>
        {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : 'Envoyer mon retour'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}
