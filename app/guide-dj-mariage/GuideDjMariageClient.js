'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Download, FileCheck2, Mail } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import { gtagEvent } from '../lib/gtag';
import { CITIES } from '../lib/cities';
import { GUIDE_TITLE, GUIDE_QUESTIONS, ARTICLE } from './guide-data.mjs';

/* Article « 7 questions à poser avant de choisir son DJ de mariage », signé Myrio (19/11).
   Avant : page de téléchargement avec la liste des titres seulement (254 mots). Les réponses
   sont maintenant lisibles en ligne (Google et les IA citent un texte complet, signé, daté) ;
   le PDF reste proposé en fin d'article, avec le même formulaire et le même suivi. */

const dateFr = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

const CSS = `
  .guide-focus:focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; border-radius: 6px; }
  .guide-article h2, .guide-article h3 { text-wrap: balance; }
  .guide-article p { text-wrap: pretty; }
  .guide-champ { width: 100%; box-sizing: border-box; min-height: 48px; background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; padding: 12px 16px; color: #fff; font-size: 16px; }
  .guide-champ:focus { outline: 2px solid var(--lime); outline-offset: 1px; }
  .guide-sommaire a:hover { color: var(--lime); }
  @media (prefers-reduced-motion: reduce) { .guide-cta { transition: none !important; } }
`;

const corps = { color: 'rgba(255,255,255,0.82)', fontSize: 17, lineHeight: 1.75 };
const petitTitre = {
  fontFamily: 'var(--font-mono), monospace', fontSize: 13, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', margin: '22px 0 8px', fontWeight: 600,
};

function Cta({ emplacement }) {
  return (
    <a href="/devis/mariage-contact" className="guide-focus guide-cta"
      onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: `guide_cta_${emplacement}` })}
      style={{
        background: 'var(--lime)', color: '#0d1b2a', padding: '15px 32px', borderRadius: 8,
        fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
        textDecoration: 'none', display: 'inline-block', textAlign: 'center', transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; }}
    >
      Vérifier la disponibilité de ma date →
    </a>
  );
}

function FormulairePdf() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [pdfUrl, setPdfUrl] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
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

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }} role="status">
        <FileCheck2 size={40} color="var(--lime)" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
        <p style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
          Votre guide est prêt
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 22 }}>
          Il vient aussi de vous être envoyé par e-mail à <strong style={{ color: 'white' }}>{email}</strong>.
        </p>
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="guide-focus" style={{
          background: 'var(--lime)', color: '#0d1b2a', padding: '14px 28px', borderRadius: 8,
          fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Download size={17} aria-hidden="true" /> Télécharger le PDF
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label htmlFor="guide-prenom" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
          Prénom <span style={{ color: 'rgba(255,255,255,0.55)' }}>(facultatif)</span>
        </label>
        <input id="guide-prenom" className="guide-champ" autoComplete="given-name" placeholder="Ex. : Camille"
          value={prenom} onChange={(e) => setPrenom(e.target.value)} />
      </div>
      <div>
        <label htmlFor="guide-email" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
          Adresse e-mail
        </label>
        <input id="guide-email" type="email" className="guide-champ" autoComplete="email" inputMode="email"
          placeholder="Ex. : camille@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <button type="submit" disabled={!email.trim() || status === 'loading'} className="guide-focus" style={{
        background: 'transparent', color: 'var(--lime)', border: '1.5px solid var(--lime)', borderRadius: 8,
        minHeight: 48, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif',
        cursor: !email.trim() || status === 'loading' ? 'default' : 'pointer',
        opacity: !email.trim() ? 0.55 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Mail size={16} aria-hidden="true" /> {status === 'loading' ? 'Envoi…' : 'Recevoir le guide en PDF'}
      </button>
      {status === 'error' && (
        <p role="alert" style={{ color: '#f87171', fontSize: 14 }}>
          L&apos;envoi n&apos;a pas fonctionné. Vérifiez votre adresse e-mail et réessayez.
        </p>
      )}
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
        Aucun spam. Votre adresse ne sert qu&apos;à vous envoyer ce guide.
      </p>
    </form>
  );
}

export default function GuideDjMariageClient() {
  const { temoignage } = ARTICLE;

  return (
    <div style={{ paddingTop: 70 }}>
      <style>{CSS}</style>

      <article className="guide-article">
        {/* ── EN-TÊTE : titre, auteur, date, introduction ─────────────── */}
        <header style={{
          padding: 'clamp(56px,8vw,96px) 32px clamp(56px,7vw,80px)',
          backgroundImage: 'url(/particuliers-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(13,27,42,0.88)' }} />
          <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <SectionLabel>Guide mariage</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(30px,4.6vw,50px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 24,
            }}>
              {GUIDE_TITLE}
            </h1>

            {/* Signature : nom, fonction, date de mise à jour, temps de lecture */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <span aria-hidden="true" style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: '50%', background: 'var(--lime)', color: '#0d1b2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 19,
              }}>M</span>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>
                <p style={{ color: '#fff', fontWeight: 600 }}>Par {ARTICLE.auteur}, {ARTICLE.fonction}</p>
                <p style={{ color: 'rgba(255,255,255,0.68)' }}>
                  Mis à jour le <time dateTime={ARTICLE.modifie}>{dateFr(ARTICLE.modifie)}</time> · Lecture : 5 min
                </p>
              </div>
            </div>

            <p style={{ ...corps, fontSize: 'clamp(17px,1.6vw,19px)', color: 'rgba(255,255,255,0.9)' }}>
              {ARTICLE.intro}
            </p>
            <a href="#pdf" className="guide-focus" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 14,
              color: 'var(--lime)', fontSize: 15, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4,
            }}>
              <Download size={16} aria-hidden="true" /> Recevoir ce guide en PDF
            </a>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, zIndex: 1 }}>
            <AnimatedWave bars={48} height={50} opacity={0.45} />
          </div>
        </header>

        <div style={{ padding: 'clamp(40px,6vw,64px) 32px clamp(56px,7vw,80px)', background: 'var(--bg-dark)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* ── EN BREF : les 7 questions, avec un lien vers chaque réponse ── */}
            <nav aria-label="Les 7 questions" className="guide-sommaire" style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12, padding: '22px 24px', marginBottom: 56,
            }}>
              <p style={{ ...petitTitre, margin: '0 0 12px', color: 'var(--lime)' }}>En bref</p>
              <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {GUIDE_QUESTIONS.map((q) => (
                  <li key={q.n} style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 1.6 }}>
                    <a href={`#question-${q.n}`} className="guide-focus" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {q.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* ── LES 7 QUESTIONS ─────────────────────────────────────── */}
            {GUIDE_QUESTIONS.map((q) => (
              <section key={q.n} id={`question-${q.n}`} style={{ marginBottom: 52, scrollMarginTop: 90 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,3vw,28px)',
                  fontWeight: 700, lineHeight: 1.25, marginBottom: 4,
                }}>
                  <span style={{ color: 'var(--lime)' }}>{q.n}.</span> {q.title}
                </h2>
                <h3 style={petitTitre}>Pourquoi la poser</h3>
                <p style={corps}>{q.why}</p>
                <h3 style={petitTitre}>La réponse à attendre</h3>
                <p style={corps}>{q.goodAnswer}</p>
                <div style={{
                  marginTop: 22, background: 'rgba(184,239,11,0.06)', borderLeft: '3px solid var(--lime)',
                  borderRadius: '0 10px 10px 0', padding: '18px 22px',
                }}>
                  <h3 style={{ ...petitTitre, margin: '0 0 8px', color: 'var(--lime)' }}>Chez Myracoustic</h3>
                  <p style={{ ...corps, fontSize: 16 }}>
                    {q.chezNous}
                    {(q.n === 2 || q.n === 7) && (
                      <> <Link href="/cgv" className="guide-focus" style={{ color: 'var(--lime)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Lire nos conditions générales</Link>.</>
                    )}
                  </p>
                </div>
              </section>
            ))}

            {/* ── TÉMOIGNAGE (vrai avis Google) ───────────────────────── */}
            <figure style={{
              margin: '8px 0 56px', padding: '26px 28px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
            }}>
              <p style={petitTitre}>Un couple raconte</p>
              <blockquote style={{ margin: 0 }}>
                <p style={{ ...corps, fontStyle: 'italic', color: 'rgba(255,255,255,0.88)' }}>« {temoignage.texte} »</p>
              </blockquote>
              <figcaption style={{ marginTop: 12, color: 'rgba(255,255,255,0.68)', fontSize: 14 }}>
                {temoignage.auteur} · {temoignage.source} · {temoignage.date}
              </figcaption>
            </figure>

            {/* ── LE MOT DE MYRIO + ACTION PRINCIPALE ─────────────────── */}
            <section aria-labelledby="mot-de-myrio" style={{ marginBottom: 64 }}>
              <h2 id="mot-de-myrio" style={{
                fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,3vw,28px)',
                fontWeight: 700, marginBottom: 12,
              }}>
                Le mot de Myrio
              </h2>
              <p style={{ ...corps, marginBottom: 26 }}>{ARTICLE.conclusion}</p>
              <Cta emplacement="fin" />
              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, marginTop: 12 }}>
                Gratuit · sans engagement · réponse sous 24h
              </p>
            </section>

            {/* ── VERSION PDF (action secondaire) ─────────────────────── */}
            <section id="pdf" aria-labelledby="titre-pdf" style={{
              scrollMarginTop: 90, background: 'rgba(13,27,42,0.9)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: 'clamp(22px,3vw,30px)', marginBottom: 56,
            }}>
              <h2 id="titre-pdf" style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                Gardez ce guide sous la main
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                Recevez la version PDF par e-mail, à imprimer ou à partager avec votre moitié avant vos rendez-vous avec les DJ.
              </p>
              <FormulairePdf />
            </section>

            {/* ── POUR ALLER PLUS LOIN (maillage interne) ─────────────── */}
            <nav aria-label="Pour aller plus loin">
              <p style={{ ...petitTitre, margin: '0 0 12px' }}>Pour aller plus loin</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { href: '/mariage', label: 'Nos prestations mariage' },
                  { href: '/organisation-mariage', label: "L'application pour organiser votre mariage" },
                  ...CITIES.map((c) => ({ href: `/dj-mariage-${c.slug}`, label: `DJ mariage ${c.nom}` })),
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="guide-focus" style={{
                      display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '10px 16px', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
                      fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </article>
    </div>
  );
}
