'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatedWave, WaveBullet, SectionLabel } from '../components/AnimatedWave';
import TestimonialCard from '../components/TestimonialCard';
import StatItem from '../components/StatItem';

/* ─── Bullet point avec onde ────────────────────────────────────── */
function BulletItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <WaveBullet size={16} />
      <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.65 }}>
        {children}
      </span>
    </div>
  );
}

/* ─── Carte prestation détaillée ────────────────────────────────── */
function ServiceDetailCard({ icon, tag, title, desc, items }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#111e2d' : 'var(--card)',
        border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, overflow: 'hidden', transition: 'all 0.28s',
        transform: hov ? 'translateY(-4px)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '32px 28px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 11, letterSpacing: '0.2em',
            color: hov ? 'var(--lime)' : 'rgba(255,255,255,0.3)',
            border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
            padding: '3px 10px', borderRadius: 3, transition: 'all 0.28s',
          }}>
            {tag}
          </span>
          <span style={{ fontSize: 28 }}>{icon}</span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 24, fontWeight: 700, marginBottom: 10,
        }}>
          {title}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
          {desc}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{it}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        padding: '16px 28px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/contact/devis-particulier" style={{
          background: 'var(--lime)', color: '#0d1b2a',
          padding: '8px 16px', borderRadius: 5, fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-block', transition: 'background 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; }}
        >
          Devis →
        </Link>
      </div>
    </div>
  );
}

/* ─── Données ───────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: '🔊', tag: 'SON', title: 'Sonorisation',
    desc: "De la sono d'appoint au système de scène professionnel. Chaque espace acoustique est unique, chaque installation aussi.",
    items: ['Systèmes Line Array & point source', 'Technicien son inclus', 'Réglage acoustique sur mesure', 'Micro HF et retours de scène'],
  },
  {
    icon: '💡', tag: 'LUMIÈRE', title: 'Éclairage',
    desc: 'Des ambiances lumineuses qui subliment votre salle et créent des instants magiques tout au long de la soirée.',
    items: ['Moving heads & PAR LED', 'Lasers & machines à effets', "Éclairage d'ambiance piste de danse", 'Machine à fumée incluse'],
  },
  {
    icon: '🎬', tag: 'VIDÉO', title: 'Vidéo & Écrans',
    desc: 'Diffusion de vos photos, vidéos et diaporamas sur grands écrans LED pour des moments intenses et partagés.',
    items: ['Vidéoprojecteur & support', 'Mur LED 2 m² ou 4 m²', 'Contenu personnalisé'],
  },
  {
    icon: '🎧', tag: 'DJ', title: 'Animation DJ',
    desc: 'DJ professionnel qui lit son public et adapte son set pour garantir une piste de danse pleine du début à la fin.',
    items: ['DJ professionnel avec références', 'Matériel haut de gamme inclus', 'Playlist 100% personnalisée', 'MC & animations sur demande'],
  },
];

const INCLUDES = [
  'Visite technique du lieu avant l\'événement',
  'Installation et démontage inclus dans le devis',
  'Technicien présent toute la soirée',
  'Devis personnalisé en ligne en moins de 2 minutes',
  'Contrat clair avec engagement de qualité',
  'Assurance responsabilité civile professionnelle',
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

/* ─── Page ──────────────────────────────────────────────────────── */
export default function ParticuliersPage() {
  return (
    <div style={{ paddingTop: 70 }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(80px,10vw,120px)',
        backgroundImage: 'url(/particuliers-hero.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Fond dégradé violet festif */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg,#1a0a3d 0%,#4a1a8e 40%,#2a0d5e 70%,#0d1b2a 100%)',
          opacity: 0.4,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.55) 60%,rgba(13,27,42,0.2) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.06) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <SectionLabel>Particuliers</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            VOTRE FÊTE,<br /><span style={{ color: 'var(--lime)' }}>NOTRE SON</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 520, marginBottom: 36,
          }}>
            Mariage, anniversaire, fête de famille — nous créons l'ambiance sonore et visuelle parfaite pour que votre événement soit inoubliable.
          </p>
          <Link href="/contact/devis-particulier" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '15px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif',
            textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Calculer mon devis en ligne →
          </Link>
        </div>

        {/* Onde décorative en bas du hero */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 2 }}>
          <AnimatedWave bars={60} height={80} opacity={0.6} />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
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
          <StatItem value="10" suffix="+" label="Premières parties de concert" />
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,8vw,96px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Nos prestations</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, marginBottom: 44,
          }}>
            Choisissez vos services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {SERVICES.map((s) => <ServiceDetailCard key={s.tag} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── CE QUE VOUS OBTENEZ ─────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px,6vw,80px) 32px',
        backgroundImage: 'url(/ban_prestation_son.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'rgba(6,14,22,0.65)',
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: 48, alignItems: 'center',
        }}>
          <div>
            <SectionLabel>Inclus dans chaque prestation</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, marginBottom: 32,
            }}>
              Ce que vous <span style={{ color: 'var(--lime)' }}>obtenez</span>
            </h2>
            {INCLUDES.map((item, i) => <BulletItem key={i}>{item}</BulletItem>)}
          </div>
          {/* Placeholder photo événement */}
          <div style={{
            borderRadius: 16, minHeight: 380,
            background: 'linear-gradient(135deg,#1a0a3d 0%,#3d1a8e 45%,#0a2a3d 80%,#0d1b2a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(255,255,255,0.018) 18px,rgba(255,255,255,0.018) 36px)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 11,
              color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em',
              textTransform: 'uppercase', zIndex: 1, textAlign: 'center', padding: '0 24px',
            }}>
              Photo événement · Mariage &amp; réception
            </span>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700,
            }}>
              Ce que disent nos clients
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
            {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2260 50%,#0d1b2a 100%)',
        borderTop: '1px solid rgba(184,239,11,0.18)',
      }}>
        <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
        <h2 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
        }}>
          Prêt à commencer ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
          Calculez votre devis en ligne en moins de 3 minutes.
        </p>
        <Link href="/contact/devis-particulier" style={{
          background: 'var(--lime)', color: '#0d1b2a',
          padding: '16px 40px', borderRadius: 8, fontSize: 17, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Calculer mon devis en ligne →
        </Link>
      </section>

    </div>
  );
}
