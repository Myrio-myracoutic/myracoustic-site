'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users2, Wand2, Music2, Phone } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import TestimonialCarousel from '../components/TestimonialCarousel';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';

/* Page dédiée aux pubs Google Ads — distincte de /mariage (page SEO/organique).
   Même base visuelle, volontairement plus courte : une seule offre, une seule action,
   pas de FAQ, pas de grille de villes, pas de bloc aimant PDF. */

// Mêmes témoignages réels que /mariage (voir MariageClient.js) — jamais reformulés.
const TESTIMONIALS = [
  { name: 'Carine et Sébastien', event: 'Mariage', stars: 5, source: 'Google', date: 'Juillet 2026',
    text: "Un immense merci à Myrio et sa femme Virginie qui nous ont clairement sauvé notre mariage. 2 semaines avant notre DJ initial nous a informé qu'il ne s'assurerait pas la prestation (pour des raisons de santé) et Myrio a été incroyable et rassurant. 2 semaines pour se caler avec nous et l'animation a été parfaite. Nous n'aurions pas pu espérer mieux. Vous voulez un évènement réussi en terme d'animation, Travaillez avec Myrio!" },
  { name: 'Alexis et Ozanne', event: 'Mariage', stars: 5, source: 'Google', date: 'Août 2026',
    text: "C'est super agréable d'avoir Myrio à ses côté pour un mariage, il s'adapte vite, et est très attachant, merci pour tout je recommande !" },
  { name: 'Sandra et Stéphanie', event: 'Mariage', stars: 5, source: 'mariages.net',
    text: "Myrio a été à l'écoute de nos envies, on a tout calé ensemble. Ces propositions ont été pertinentes. Nous l'avions déjà vu comme dj dans des soirées repas d'entreprise et comme nous l'avions apprécié nous l'avons contacté pour notre mariage. Il est en plus super bien équipé en matériel du coup ça facilite pour faire des animations tout au long de la soirée." },
];

// Mêmes liens légaux que Footer.js, sans "Espace client" — page pub à une seule offre,
// aucun lien de sortie vers le reste du site.
const LEGAL_LINKS = [
  { href: '/mentions-legales',          label: 'Mentions légales' },
  { href: '/cgv',                       label: 'Conditions générales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
];

const ENGAGEMENTS = [
  { icon: Users2, title: 'Une seule équipe, une seule exigence',
    text: "Un seul interlocuteur prend en charge l'ensemble — son, lumière, vidéo, animation — avec la même exigence du premier échange à la dernière danse." },
  { icon: Wand2, title: 'Sur mesure, pour votre lieu',
    text: "Un accompagnement taillé pour votre lieu et le déroulé exact de votre soirée." },
];

function CtaButton({ children = 'Vérifier la disponibilité de ma date →', style }) {
  return (
    <a href="/devis/mariage-contact" onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: 'dj_mariage_ads_cta' })} style={{
      background: 'var(--lime)', color: '#0d1b2a',
      padding: '15px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700,
      fontFamily: 'var(--font-display), sans-serif',
      textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
      ...style,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </a>
  );
}

function AvailabilityLine({ availability }) {
  if (!availability) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 }}>
        Votre date part vite — vérifiez si elle est encore libre.
      </p>
    );
  }
  const { available, untilLabel } = availability;
  let text;
  if (available === 0) {
    text = `Tous les samedis sont réservés d'ici ${untilLabel} — contactez-nous, d'autres jours restent parfois envisageables.`;
  } else if (available === 1) {
    text = `Plus qu'un seul samedi disponible d'ici ${untilLabel} — vérifiez si c'est le vôtre.`;
  } else {
    text = `Encore ${available} samedis disponibles d'ici ${untilLabel} — vérifiez si le vôtre en fait partie.`;
  }
  return (
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 }}>
      {text}
    </p>
  );
}

export default function DjMariageClient({ availability }) {
  return (
    <div>

      {/* ── EN-TÊTE ─────────────────────────────────────────────── */}
      {/* Logo + téléphone/horaires, sans menu ni lien de sortie : une page pub à une seule
          offre (voir /devis/mariage-contact, même principe). Le téléphone est un canal de
          conversion supplémentaire, pas une distraction — pas de lien vers d'autres pages. */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '14px 32px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'rgba(6,14,22,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Image src="/logo.png" alt="Myracoustic" width={140} height={47} style={{ height: 38, width: 'auto' }} priority />
        <div style={{ textAlign: 'right' }}>
          <a href="tel:0768533308" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            <Phone size={14} /> 07 68 53 33 08
          </a>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginTop: 2 }}>
            Lun-Sam · 10h-18h
          </div>
        </div>
      </div>

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
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(184,239,11,0.3)', background: 'rgba(184,239,11,0.06)',
          }}>
            <span style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' }}>★ 5/5 sur Google</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif' }}>200+ mariages orchestrés</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            VOTRE MARIAGE,<br /><span style={{ color: 'var(--lime)' }}>ORCHESTRÉ AVEC EXIGENCE</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 540, marginBottom: 36,
          }}>
            Châteaux, domaines, demeures de caractère : une seule équipe orchestre le son, la lumière, la vidéo et l&apos;animation de votre mariage en Pays de la Loire, du premier oui à la dernière danse.
          </p>
          <CtaButton />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 14, fontFamily: 'var(--font-display), sans-serif' }}>
            Gratuit · sans engagement · devis personnalisé sous 48h
          </p>
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
          <StatItem value="200" suffix="+" label="Mariages orchestrés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
        <Reveal style={{ maxWidth: 720, margin: '40px auto 0', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.8 }}>
            Basé à Nort-sur-Erdre, à 25 minutes de Nantes, Myracoustic est un prestataire de sonorisation, éclairage, vidéo et animation DJ pour mariages en Pays de la Loire — Nantes, Angers, Rennes, Saint-Nazaire et leurs environs.
          </p>
        </Reveal>
      </section>

      {/* ── CE QUI NE CHANGE JAMAIS ─────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Notre engagement</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Ce qui ne change jamais
            </h2>
          </div>
          <div style={{
            maxWidth: 860, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 36,
          }}>
            {ENGAGEMENTS.map((e, i) => (
              <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <e.icon size={20} color="var(--lime)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
                  {e.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.75 }}>
                  {e.text}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── VOTRE MUSIQUE ───────────────────────────────────────── */}
      <section style={{ padding: '0 32px clamp(56px,7vw,88px)' }}>
        <Reveal style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Music2 size={20} color="var(--lime)" />
          </div>
          <SectionLabel style={{ justifyContent: 'center' }}>Votre musique</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14,
          }}>
            Votre soirée, pas notre catalogue
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8 }}>
            Depuis votre espace personnel, vous construisez vous-même la musique de votre soirée — recherche de titres, écoute d&apos;extraits, playlist par moment de la journée. Vos invités peuvent même proposer des titres : c&apos;est vous qui décidez ce qui joue.
          </p>
        </Reveal>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Ils nous ont confié leur mariage
            </h2>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
          <Reveal style={{ textAlign: 'center', marginTop: 44 }}>
            <CtaButton style={{ padding: '15px 34px' }} />
            <AvailabilityLine availability={availability} />
          </Reveal>
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
            Un devis personnalisé, sans engagement, sous 48h.
          </p>
          <CtaButton style={{ padding: '16px 40px', fontSize: 17 }} />
        </Reveal>
      </section>

      {/* ── PIED DE PAGE ────────────────────────────────────────── */}
      {/* Mentions légales obligatoires uniquement — pas de lien "Espace client" ni de
          navigation vers d'autres pages du site, volontairement. */}
      <div style={{ padding: '22px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, whiteSpace: 'nowrap' }}>
            © 2026 Myracoustic.
          </p>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{
              color: 'rgba(255,255,255,0.22)', fontSize: 12,
              textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.12)',
              transition: 'color 0.2s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new Event('myra-cookie-prefs'))}
            style={{
              color: 'rgba(255,255,255,0.22)', fontSize: 12, background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.12)',
              transition: 'color 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; }}
          >
            Préférences cookies
          </button>
        </div>
      </div>

    </div>
  );
}
