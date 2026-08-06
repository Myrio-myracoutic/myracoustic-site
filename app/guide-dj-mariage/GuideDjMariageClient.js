'use client';
import { useState } from 'react';
import { Download, FileCheck2, Mail } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_QUESTIONS } from './guide-data.mjs';

const IS = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
};

export default function GuideDjMariageClient() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [pdfUrl, setPdfUrl] = useState(null);

  const submit = async () => {
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide: 'dj-mariage-7-questions', email: email.trim(), firstName: prenom.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setPdfUrl(data.pdfUrl);
      setStatus('done');
      gtagEvent('generate_lead', { profil: 'mariage', lead_magnet: 'dj-mariage-7-questions' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ paddingTop: 70 }}>
      {/* ── HERO + FORMULAIRE ──────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(56px,7vw,88px)',
        backgroundImage: 'url(/particuliers-hero.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg,#1a050e 0%,#4a0e24 40%,#2a0a16 70%,#0d1b2a 100%)',
          opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.55) 60%,rgba(13,27,42,0.2) 100%)',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <SectionLabel>Guide gratuit</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(30px,4.5vw,52px)', fontWeight: 700,
              lineHeight: 1.08, letterSpacing: '-0.01em', marginBottom: 18,
            }}>
              {GUIDE_TITLE}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px,1.3vw,16px)',
              lineHeight: 1.75, maxWidth: 480, marginBottom: 8,
            }}>
              {GUIDE_SUBTITLE}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Gratuit · au format PDF · reçu immédiatement
            </p>
          </div>

          <div style={{
            background: 'rgba(13,27,42,0.75)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 'clamp(24px,3vw,32px)', backdropFilter: 'blur(6px)',
          }}>
            {status === 'done' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <FileCheck2 size={40} color="var(--lime)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
                  Votre guide est prêt
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 1.7, marginBottom: 22 }}>
                  Il vient aussi de vous être envoyé par email à <strong style={{ color: 'white' }}>{email}</strong>.
                </p>
                <a href={pdfUrl} target="_blank" rel="noreferrer" style={{
                  background: 'var(--lime)', color: '#0d1b2a', padding: '14px 28px', borderRadius: 8,
                  fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <Download size={17} /> Télécharger maintenant
                </a>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                  Recevez le guide gratuitement
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>
                  Un email, et c'est envoyé.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} style={IS} />
                  <input type="email" placeholder="votre@email.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    style={IS} />
                  <button onClick={submit} disabled={!email.trim() || status === 'loading'} style={{
                    background: 'var(--lime)', color: '#0d1b2a', border: 'none', borderRadius: 8,
                    padding: '14px 0', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
                    cursor: !email.trim() || status === 'loading' ? 'default' : 'pointer',
                    opacity: !email.trim() ? 0.5 : 1, marginTop: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Mail size={16} /> {status === 'loading' ? 'Envoi…' : 'Recevoir mon guide gratuit'}
                  </button>
                  {status === 'error' && (
                    <p style={{ color: '#ef4444', fontSize: 12.5, marginTop: 2 }}>
                      Une erreur est survenue — vérifiez votre email et réessayez.
                    </p>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
                  Aucun spam. Votre email ne sert qu'à vous envoyer ce guide.
                </p>
              </>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, zIndex: 2 }}>
          <AnimatedWave bars={60} height={60} opacity={0.5} />
        </div>
      </section>

      {/* ── APERÇU DES 7 QUESTIONS ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <Reveal style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Au sommaire</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700,
            }}>
              Ce que vous allez y trouver
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GUIDE_QUESTIONS.map(q => (
              <div key={q.n} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '14px 18px',
              }}>
                <span style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(184,239,11,0.12)', color: 'var(--lime)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13,
                }}>{q.n}</span>
                <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.82)' }}>{q.title}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
