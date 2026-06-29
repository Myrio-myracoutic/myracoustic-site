'use client';

import { useState } from 'react';
import { Headphones, Mic, Lightbulb, Video } from 'lucide-react';
import { AnimatedWave, WaveBullet, SectionLabel } from '../components/AnimatedWave';
import { FAQ_ITEMS } from './faq-data';
import TestimonialCard from '../components/TestimonialCard';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';

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

function ServiceDetailCard({ icon: Icon, tag, title, desc, items }) {
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
          <span style={{ color: hov ? 'var(--lime)' : 'rgba(255,255,255,0.72)' }}><Icon size={28} strokeWidth={1.5} /></span>
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
      <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/devis/mariage" style={{
          background: 'var(--lime)', color: '#0d1b2a',
          padding: '8px 16px', borderRadius: 5, fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-block', transition: 'background 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; }}
        >
          Devis →
        </a>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${open ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '18px 22px', color: '#fff',
        fontFamily: 'var(--font-display), sans-serif', fontSize: 15, fontWeight: 600,
      }}>
        {q}
        <span style={{
          flexShrink: 0, color: open ? 'var(--lime)' : 'rgba(255,255,255,0.35)',
          fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
        }}>+</span>
      </button>
      {open && (
        <p style={{ margin: 0, padding: '0 22px 20px', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
          {a}
        </p>
      )}
    </div>
  );
}

const SERVICES = [
  {
    icon: Headphones, tag: 'DJ MARIAGE', title: 'Animation DJ',
    desc: "Un DJ expérimenté en mariages qui lit son public, soigne chaque transition et maintient l'énergie de la piste du premier au dernier morceau.",
    items: ["Ouverture de bal préparée ensemble", "Playlist 100% personnalisée", "Set soirée dansante jusqu'au bout", "MC & animations (lancer de bouquet, etc.)"],
  },
  {
    icon: Mic, tag: 'CÉRÉMONIE', title: 'Son cérémonie & cocktail',
    desc: "Sonorisation discrète et élégante pour vos vœux, lectures et moments clés — puis musique d'ambiance pour le vin d'honneur.",
    items: ["Micro sans fil pour l'officiant", "Musique d'entrée & sortie personnalisée", "Sono cocktail & vin d'honneur", "Discours amplifiés au micro"],
  },
  {
    icon: Lightbulb, tag: 'ÉCLAIRAGE', title: 'Ambiance lumineuse',
    desc: "Des lumières qui métamorphosent votre salle et créent les atmosphères de chaque moment de votre soirée.",
    items: ["Moving heads & PAR LED", "Gobos à vos prénoms / initiales", "Machine à fumée & brouillard", "Éclairage dynamique piste de danse"],
  },
  {
    icon: Video, tag: 'VIDÉO', title: 'Diaporama & écrans',
    desc: "Projetez vos plus belles photos de couple, votre histoire ensemble — un écrin visuel qui émeut vos invités.",
    items: ["Projection photos/vidéos du couple", "Mur LED 2 m² ou 4 m²", "Contenu personnalisé & animé", "Intégration avec fond musical"],
  },
];

const INCLUDES = [
  "Visite technique du lieu avant le mariage",
  "Coordination avec votre wedding planner ou traiteur",
  "Planification musicale complète (cérémonie, cocktail, dîner, soirée)",
  "Échanges et écoute jusqu'au jour J",
  "Installation et démontage inclus dans le devis",
  "Assurance responsabilité civile professionnelle",
];

const TESTIMONIALS = [
  { name: 'Treecy et Jerry', event: 'Mariage', stars: 5,
    text: "C'est un dj très professionnel, compréhensif et qui s'adapte à toutes situations. Le rapport qualité prix est au top. Je recommande fortement. Amusement garantie." },
  { name: 'Sandra et Stéphanie', event: 'Mariage', stars: 5,
    text: "Myrio a été à l'écoute de nos envies, on a tout calé ensemble. Ces propositions ont été pertinentes. Nous l'avions déjà vu comme dj dans des soirées repas d'entreprise et comme nous l'avions apprécié nous l'avons contacté pour notre mariage. Il est en plus super bien équipé en matériel du coup ça facilite pour faire des animations tout au long de la soirée." },
];

export default function MariageClient() {
  return (
    <div style={{ paddingTop: 70 }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(80px,10vw,120px)',
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
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.05) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <SectionLabel>Mariage</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            VOTRE MARIAGE,<br /><span style={{ color: 'var(--lime)' }}>NOTRE MUSIQUE</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 520, marginBottom: 36,
          }}>
            De la cérémonie à l'ouverture de bal, jusqu'aux dernières danses — Myracoustic crée l'atmosphère sonore et visuelle de votre plus belle journée.
          </p>
          <a href="/devis/mariage" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '15px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif',
            textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Calculer mon devis mariage →
          </a>
        </div>

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
        <Reveal style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32,
        }}>
          <StatItem value="26" suffix="+" label="Années d'expérience" />
          <StatItem value="200" suffix="+" label="Mariages animés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
      </section>

      {/* ── CE QUE VOUS OBTENEZ ─────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px,6vw,80px) 32px',
        backgroundImage: 'url(/ban_prestation_son.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.65)' }} />
        <Reveal style={{
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
          <div style={{
            borderRadius: 16, minHeight: 380,
            backgroundImage: 'url(/ban_fête_myr.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        </Reveal>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700,
            }}>
              Ils nous ont confié leur mariage
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
            {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Questions fréquentes</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Vous avez des questions ?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
              Voici les réponses aux questions les plus fréquentes sur nos prestations mariage.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </Reveal>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a0510 50%,#0d1b2a 100%)',
        borderTop: '1px solid rgba(184,239,11,0.18)',
      }}>
        <Reveal>
        <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
        <h2 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
        }}>
          Disponible pour votre date ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
          Calculez votre devis mariage en ligne en moins de 3 minutes.
        </p>
        <a href="/devis/mariage" style={{
          background: 'var(--lime)', color: '#0d1b2a',
          padding: '16px 40px', borderRadius: 8, fontSize: 17, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif',
          textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Calculer mon devis mariage →
        </a>
        </Reveal>
      </section>

    </div>
  );
}
