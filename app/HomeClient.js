'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatedWave, WaveBullet, SectionLabel } from './components/AnimatedWave';
import TestimonialCard from './components/TestimonialCard';
import StatItem from './components/StatItem';

/* ─── Carte service ────────────────────────────────────────────── */
function ServiceCard({ icon, tag, title, desc, index }) {
  const [hov, setHov] = useState(false);
  const radii = ['12px 0 0 0', '0 12px 0 0', '0 0 0 12px', '0 0 12px 0'];
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', padding: '40px 36px',
        background: hov ? '#111e2d' : 'var(--card)',
        border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: radii[index] || 0,
        transition: 'all 0.28s ease', cursor: 'default', overflow: 'hidden',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
          background: 'var(--lime)',
        }} />
      )}
      <div style={{ marginBottom: 18 }}>
        <span style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 11, letterSpacing: '0.2em',
          color: hov ? 'var(--lime)' : 'rgba(255,255,255,0.3)',
          border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
          padding: '3px 10px', borderRadius: 3, transition: 'all 0.28s',
        }}>
          {tag}
        </span>
      </div>
      <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 26, fontWeight: 700, marginBottom: 10,
      }}>
        {title}
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 15, lineHeight: 1.75, maxWidth: 320 }}>
        {desc}
      </p>
      <div style={{
        position: 'absolute', bottom: 24, right: 24, fontSize: 20,
        color: 'var(--lime)', opacity: hov ? 1 : 0,
        transform: hov ? 'translateX(0)' : 'translateX(-12px)',
        transition: 'all 0.28s',
      }}>
        →
      </div>
    </div>
  );
}

/* ─── Page d'accueil ───────────────────────────────────────────── */
const SERVICES = [
  { icon: '🔊', tag: 'SON',     title: 'Sonorisation',  index: 0,
    desc: 'Systèmes audio de pointe, du cocktail intime aux grandes salles. Son clair, puissant, maîtrisé.' },
  { icon: '💡', tag: 'LUMIÈRE', title: 'Éclairage',     index: 1,
    desc: 'Moving heads, lasers, LED et gobos pour créer des ambiances spectaculaires et sur mesure.' },
  { icon: '🎬', tag: 'VIDÉO',   title: 'Vidéo & Mapping', index: 2,
    desc: 'Écrans LED, projection architecturale et retransmission live en haute définition.' },
  { icon: '🎧', tag: 'DJ',      title: 'Animation DJ',  index: 3,
    desc: 'DJ professionnel qui lit son public et fait danser du premier au dernier morceau.' },
];

const TESTIMONIALS = [
  { name: 'Virginie.G',  event: 'Anniversaire · 90 personnes', stars: 5,
    text: "J'ai fais appel à Myracoustic pour un anniversaire et nous avions été très satisfait de sa prestation. Personne a l'écoute, ambiance au top. Je recommande++++" },
  { name: 'Treecy et Jerry', event: 'Mariage', stars: 5,
    text: "C'est un dj très professionnel, compréhensif et qui s'adapte à toutes situations. Le rapport qualité prix est au top. Je recommande fortement. Amusement garantie." },
  { name: 'Sandra et Stéphanie', event: 'Mariage', stars: 5,
    text: "Myrio a été à l'écoute de nos envies, on a tout calé ensemble. Ces propositions ont été pertinentes. Nous l'avions déjà vu comme dj dans des soirées repas d'entreprise et comme nous l'avions apprécié nous l'avons contacté pour notre mariage. Il est en plus super bien équipé en matériel du coup ça facilite pour faire des animations tout au long de la soirée." },
  { name: 'Patricia.A', event: 'Anniversaire intergénérationnel', stars: 5,
    text: "Une soirée comme on en rêve pour réunir plusieurs générations : tout le monde a dansé, des plus jeunes aux plus grands. Merci à Myrio pour cette ambiance chaleureuse du début à la fin !" },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const anim = (delay) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        overflow: 'hidden',
        backgroundImage: 'url(/hero.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg,rgba(13,27,42,0.93) 0%,rgba(13,27,42,0.72) 55%,rgba(13,27,42,0.55) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 70% at 10% 50%,rgba(52,55,144,0.22) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(100px,12vw,140px) 32px 60px', width: '100%' }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, ...anim(0.15) }}>
              <WaveBullet size={16} />
              <span style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}>
                Son · Lumière · Vidéo · DJ
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(54px,9vw,124px)',
              fontWeight: 700, lineHeight: 0.92, letterSpacing: '-0.025em',
              marginBottom: 28,
              ...anim(0.3),
            }}>
              SUBLIMEZ<br />
              <span style={{ color: 'var(--lime)' }}>VOS</span><br />
              ÉVÉNEMENTS
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.56)',
              fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.75,
              maxWidth: 520, marginBottom: 40,
              ...anim(0.45),
            }}>
              Prestataire événementiel — son, lumière, vidéo et DJ pour{' '}
              <strong style={{ color: 'white' }}>mariages et événements privés</strong>{' '}
              comme pour vos <strong style={{ color: 'white' }}>séminaires et galas d'entreprise</strong>.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', ...anim(0.6) }}>
              <Link href="/evenement-entreprise" style={{
                background: 'var(--lime)', color: '#0d1b2a',
                padding: 'clamp(13px,1.5vw,16px) clamp(22px,2.5vw,32px)',
                borderRadius: 8, fontSize: 'clamp(14px,1.2vw,16px)', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 9,
                fontFamily: 'var(--font-display), sans-serif',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Entreprises <span>→</span>
              </Link>
              <Link href="/evenements-prives" style={{
                background: 'transparent', color: 'white',
                border: '2px solid rgba(255,255,255,0.35)',
                padding: 'clamp(13px,1.5vw,16px) clamp(22px,2.5vw,32px)',
                borderRadius: 8, fontSize: 'clamp(14px,1.2vw,16px)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 9,
                fontFamily: 'var(--font-display), sans-serif',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Particuliers <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section style={{
        padding: '72px 32px',
        background: '#060e16',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32,
        }}>
          <StatItem value="26" suffix="+" label="Années d'expérience" />
          <StatItem value="1000" suffix="+" label="Événements réalisés" />
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,8vw,100px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 52 }}>
            <SectionLabel>Nos Prestations</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700, lineHeight: 1.1,
            }}>
              Tout ce qu'il faut pour<br />
              <span style={{ color: 'var(--lime)' }}>un événement parfait</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 2 }}>
            {SERVICES.map((s) => <ServiceCard key={s.tag} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        background: 'linear-gradient(180deg,transparent 0%,#060e16 100%)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 52, textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Avis Clients</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(26px,3.5vw,46px)', fontWeight: 700,
            }}>
              Ils nous ont fait confiance
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
            {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2260 50%,#0d1b2a 100%)',
        borderTop: '1px solid rgba(184,239,11,0.18)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 'clamp(26px,4vw,50px)', fontWeight: 700, marginBottom: 14,
        }}>
          Prêt à créer un <span style={{ color: 'var(--lime)' }}>événement mémorable ?</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, marginBottom: 36 }}>
          Obtenez votre devis personnalisé en quelques minutes.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://devis.myracoustic.com" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '15px 34px', borderRadius: 8, fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif',
            textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Calculer mon devis →
          </a>
          <Link href="/evenement-entreprise" style={{
            background: 'transparent', color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '15px 34px', borderRadius: 8, fontSize: 16, fontWeight: 600,
            fontFamily: 'var(--font-display), sans-serif',
            textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Contact Entreprises
          </Link>
        </div>
        <AnimatedWave bars={56} height={52} style={{ marginTop: 48, maxWidth: 560, margin: '48px auto 0' }} opacity={0.55} />
      </section>
    </div>
  );
}
