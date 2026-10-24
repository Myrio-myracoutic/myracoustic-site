'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle2, Phone } from 'lucide-react';

const RAISONS = [
  { key: 'prix', label: 'Le budget ne correspondait pas' },
  { key: 'offre_mismatch', label: "L'offre ne correspondait pas à ce que j'imaginais" },
  { key: 'autre_prestataire', label: "J'ai choisi un autre prestataire" },
  { key: 'parcours_confus', label: 'Le parcours a été trop long ou confus' },
  { key: 'annule', label: 'Mon mariage est annulé ou reporté' },
  { key: 'sans_suite', label: "Je n'ai plus besoin de prestataire" },
  { key: 'autre', label: 'Autre raison' },
];

// Second niveau, seulement pour les raisons où creuser apporte un vrai signal (voir
// app/api/proposition/[token]/refuser/route.js, SOUS_RAISONS côté serveur — à garder synchro).
const SOUS_RAISONS = {
  prix: {
    question: "Qu'est-ce qui était trop élevé ?",
    options: [
      { key: 'total', label: 'Le montant total' },
      { key: 'acompte', label: "L'acompte demandé" },
      { key: 'autre', label: 'Autre raison' },
    ],
  },
  autre_prestataire: {
    question: "Qu'est-ce qui vous a fait choisir cet autre prestataire ?",
    options: [
      { key: 'moins_cher', label: 'Moins cher' },
      { key: 'offre_plus_interessante', label: 'Offre plus intéressante' },
      { key: 'disponible', label: 'Disponible à la date souhaitée' },
      { key: 'recommande', label: "Recommandé par quelqu'un" },
      { key: 'autre', label: 'Autre raison' },
    ],
  },
  offre_mismatch: {
    question: 'Qu\'est-ce qui ne correspondait pas ?',
    options: [
      { key: 'prestations', label: 'Les prestations incluses' },
      { key: 'prix_options', label: 'Le prix des options' },
      { key: 'formule', label: 'La formule ne correspondait pas à votre besoin' },
      { key: 'autre', label: 'Autre raison' },
    ],
  },
  parcours_confus: {
    question: "Qu'est-ce qui a été compliqué ?",
    options: [
      { key: 'delai', label: 'Le délai de réponse' },
      { key: 'site', label: 'Le site difficile à comprendre' },
      { key: 'etapes', label: "Trop d'étapes / d'allers-retours" },
      { key: 'autre', label: 'Autre raison' },
    ],
  },
};

// Pour affiner le commentaire libre quand le choix du 2e niveau laisse supposer qu'il y a
// davantage à dire (plutôt qu'un 3e niveau rigide de boutons).
const COMMENT_PLACEHOLDER = {
  'autre_prestataire.offre_plus_interessante': 'Qu\'est-ce qui vous a semblé plus intéressant ?',
};

// Combinaisons raison+sous-raison où un souci d'argent est peut-être réglable par téléphone
// (paiement échelonné, formule ajustée, réduction ponctuelle) plutôt qu'une vraie fin de non-recevoir.
const CALL_OFFER = {
  'prix.acompte': "Le montant total vous convient, mais l'acompte est trop lourd à sortir maintenant ? On a peut-être une solution de paiement plus souple à vous proposer.",
  'prix.total': 'Un budget serré ne doit pas vous arrêter. Parlons-en, on a sûrement une solution adaptée.',
};

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
  const [sousRaison, setSousRaison] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const chooseRaison = (key) => { setRaison(key); setSousRaison(''); };
  const sousRaisons = SOUS_RAISONS[raison];
  const canSubmit = !!raison && (!sousRaisons || !!sousRaison);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const callOffer = CALL_OFFER[`${raison}.${sousRaison}`];

  const requestCall = async () => {
    if (callLoading) return;
    setCallLoading(true);
    try {
      const res = await fetch(`/api/proposition/${token}/call-link`);
      const d = await res.json();
      if (res.ok && d.token) { window.location.href = `/rendez-vous/${d.token}`; return; }
    } catch {}
    setCallLoading(false);
  };

  useEffect(() => {
    fetch(`/api/proposition/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setP(d.proposal))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (sending || !canSubmit) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/proposition/${token}/refuser`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raison, sousRaison: sousRaison || undefined, commentaire: commentaire.trim() || undefined }),
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
        Votre réponse nous aide à améliorer notre service. Ça ne prend qu&apos;une minute.
      </p>

      {raison && (
        <button onClick={() => { setRaison(''); setSousRaison(''); setCommentaire(''); }} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 14, fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
        }}>
          ← Choisir une autre raison
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {(raison ? RAISONS.filter(r => r.key === raison) : RAISONS).map(r => {
          const subs = SOUS_RAISONS[r.key];
          return (
            <div key={r.key}>
              <button onClick={() => chooseRaison(r.key)} style={{
                width: '100%', textAlign: 'left', padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600,
                border: raison === r.key ? '1px solid var(--lime)' : '1px solid rgba(255,255,255,0.12)',
                background: raison === r.key ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.04)',
                color: raison === r.key ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
              }}>
                {r.label}
              </button>

              {raison === r.key && (
                <div style={{ marginTop: 10, marginLeft: 14, paddingLeft: 14, borderLeft: '2px solid rgba(184,239,11,0.3)', animation: 'slideDown 0.25s ease' }}>
                  {subs && (
                    <>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{subs.question}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {subs.options.map(o => (
                          <button key={o.key} onClick={() => setSousRaison(o.key)} style={{
                            padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                            border: sousRaison === o.key ? '1px solid var(--lime)' : '1px solid rgba(255,255,255,0.14)',
                            background: sousRaison === o.key ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.04)',
                            color: sousRaison === o.key ? 'var(--lime)' : 'rgba(255,255,255,0.7)',
                          }}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {callOffer && (
                    <div style={{ background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 12 }}>
                        {callOffer}
                      </p>
                      <button onClick={requestCall} disabled={callLoading} style={{
                        width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--lime)', border: 'none', color: '#0d1b2a',
                        borderRadius: 8, padding: '11px 16px', fontSize: 13.5, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
                        cursor: callLoading ? 'not-allowed' : 'pointer', opacity: callLoading ? 0.6 : 1,
                      }}>
                        {callLoading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Phone size={14} />}
                        Réserver un appel
                      </button>
                    </div>
                  )}

                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 }}>
                    Un mot de plus ? (facultatif)
                  </label>
                  <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} style={textarea}
                    placeholder={COMMENT_PLACEHOLDER[`${r.key}.${sousRaison}`] || 'Dites-nous-en plus si vous le souhaitez…'} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 14 }}>{error}</p>}

      <button onClick={submit} disabled={sending || !canSubmit} className={callOffer ? undefined : 'btn-primary'} style={callOffer ? {
        width: '100%', justifyContent: 'center', background: 'none', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.6)',
        borderRadius: 10, padding: '12px 18px', fontSize: 13.5, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
        opacity: sending || !canSubmit ? 0.5 : 1, cursor: sending || !canSubmit ? 'not-allowed' : 'pointer',
      } : {
        width: '100%', justifyContent: 'center', opacity: sending || !canSubmit ? 0.5 : 1, cursor: sending || !canSubmit ? 'not-allowed' : 'pointer',
      }}>
        {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : callOffer ? 'Non merci, j\'envoie juste mon retour' : 'Envoyer mon retour'}
      </button>
      {raison && sousRaisons && !sousRaison && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>Choisissez une précision ci-dessus pour valider.</p>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </Shell>
  );
}
