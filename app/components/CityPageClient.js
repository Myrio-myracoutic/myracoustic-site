'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatedWave, WaveBullet, SectionLabel } from './AnimatedWave';

function PillarCard({ icon, title, desc }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '28px 24px',
    }}>
      <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function AudienceCard({ tag, title, desc, href, cta }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '32px 28px',
    }}>
      <span style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lime)',
      }}>{tag}</span>
      <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 700, margin: '10px 0 12px' }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 14, lineHeight: 1.75, marginBottom: 22 }}>{desc}</p>
      <Link href={href} style={{
        color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif',
        fontSize: 14, fontWeight: 700, textDecoration: 'none',
        borderBottom: '1px solid rgba(184,239,11,0.35)', paddingBottom: 2,
      }}>
        {cta}
      </Link>
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
      <button onClick={() => setOpen((o) => !o)} style={{
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

const PILLARS = [
  { icon: '🔊', title: 'Sonorisation', desc: "Une intelligibilité optimale et une couverture homogène, adaptée à la configuration du lieu — salle, chapiteau, extérieur." },
  { icon: '💡', title: 'Éclairage', desc: "Mise en valeur de l'espace, des intervenants et de l'ambiance, avec un éclairage scénique professionnel." },
  { icon: '🖥️', title: 'Vidéo & écran LED', desc: "Affichage grand format pour vos supports visuels, votre identité de marque ou la mise en scène de votre soirée." },
  { icon: '🎶', title: 'Animation DJ', desc: "Animation musicale sur mesure pour mariages, anniversaires et soirées privées, du cocktail à la piste de danse." },
];

export default function CityPageClient({ city }) {
  const { nom, distance, temps, zones, intro, faq } = city;

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
          background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2e4a 40%,#0d1b2a 100%)',
          opacity: 0.55,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right,rgba(13,27,42,0.85) 0%,rgba(13,27,42,0.45) 55%,rgba(13,27,42,0.1) 100%)',
        }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <SectionLabel>Sonorisation événementielle</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(40px,7vw,84px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.025em', marginBottom: 24,
          }}>
            SONORISATION<br />
            <span style={{ color: 'var(--lime)' }}>ÉVÉNEMENTIELLE</span><br />
            À {nom.toUpperCase()}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(14px,1.5vw,17px)', lineHeight: 1.75,
            maxWidth: 560, marginBottom: 36,
          }}>
            {intro}
          </p>
          <a href="/devis/particulier" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif',
            textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Demander un devis →
          </a>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, zIndex: 2 }}>
          <AnimatedWave bars={56} height={70} opacity={0.55} />
        </div>
      </section>

      {/* ── NOS PRESTATIONS ─────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Nos prestations à {nom}</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
          }}>
            Une offre <span style={{ color: 'var(--lime)' }}>complète</span>, un seul interlocuteur
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 36 }}>
            Quel que soit votre événement à {nom}, Myracoustic conçoit et exploite un dispositif technique cohérent, de la sonorisation à l&apos;animation.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {PILLARS.map((p) => <PillarCard key={p.title} {...p} />)}
          </div>
        </div>
      </section>

      {/* ── ZONE D'INTERVENTION ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Zone d&apos;intervention</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
          }}>
            Basé à Nort-sur-Erdre,{' '}
            <span style={{ color: 'var(--lime)' }}>{distance} de {nom}</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 28 }}>
            {nom} est une de nos zones d&apos;intervention régulières ({distance} — {temps}). Nous intervenons également dans les villes et régions suivantes :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {zones.map((z) => (
              <div key={z} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '10px 18px',
              }}>
                <WaveBullet size={14} />
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 14, fontWeight: 600 }}>{z}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POUR QUI ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Pour qui ?</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 36,
          }}>
            Une prestation adaptée à <span style={{ color: 'var(--lime)' }}>chaque projet</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            <AudienceCard
              tag="Particuliers"
              title="Mariages & événements privés"
              desc={`Sonorisation, éclairage et animation DJ pour mariages, anniversaires et réceptions privées à ${nom} et dans toute la région.`}
              href="/evenements-prives"
              cta="Découvrir l'offre Particuliers →"
            />
            <AudienceCard
              tag="Entreprises"
              title="Séminaires & événements d'entreprise"
              desc={`Sonorisation professionnelle, éclairage, écran LED et régie technique pour vos séminaires, conventions et galas à ${nom} et environs.`}
              href="/evenement-entreprise"
              cta="Découvrir l'offre Entreprises →"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Questions fréquentes</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Sonorisation à {nom} : vos questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faq.map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </div>
      </section>

    </div>
  );
}
