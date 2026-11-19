'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import TestimonialCarousel from '../components/TestimonialCarousel';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';
import { PORTES } from './portes';
import PorteSection from './PorteSection';
import {
  insecable, useLazyBackground, FaqItem, ENGAGEMENT_SERENITE, MARIAGE_BLOCS_CSS,
  BlocApproche, BlocQuiSommesNous, BlocGalerie, BlocServices,
} from '../components/MariageBlocs';

/* Landing page dédiée — persona "premier mariage, zéro stress technique".
   Même base visuelle que /dj-mariage et /mariage. CTA unifié vers le tunnel existant
   (/devis/mariage-contact) : pas de formulaire embarqué sur cette page, volontairement. */

// Même parcours d'accompagnement que /mariage (voir MariageClient.js) — contenu identique.
const JOURNEY = [
  { when: 'Premier contact', title: 'On découvre votre projet',
    text: "Vous nous présentez votre mariage, on vous présente Myracoustic. Un devis clair et détaillé vous est envoyé, sans engagement." },
  { when: 'Réservation', title: 'Votre date est à vous',
    text: "Dès réception de l'acompte, votre date est bloquée — on ne la propose plus à personne d'autre." },
  { when: 'Quelques jours après', title: 'Découverte de votre espace',
    text: "On vous présente votre espace de mariage en ligne : programme, playlists, invités, faire-part — tout au même endroit, à votre rythme." },
  { when: '6 mois avant', title: 'Visite du lieu',
    text: "Rendez-vous sur place pour caler ensemble l'organisation technique : sonorisation, implantation, accès, contraintes du lieu." },
  { when: '1 mois avant', title: 'On reprend chaque détail',
    text: "Déroulé, playlist, derniers ajustements — on fait le point ensemble pour que rien ne soit laissé au hasard." },
  { when: '2 semaines avant', title: 'Tout est prêt',
    text: "Le déroulé est figé, le matériel est vérifié." },
  { when: 'Le jour J', title: 'vous profitez. On s’occupe du reste.',
    text: "26 ans d'expérience et plus de 200 mariages animés : on a déjà vu l'imprévu et on sait le gérer en coulisses. Vous, vous êtes sur la piste.",
    highlight: true },
  { when: '1 semaine après', title: 'Un dernier mot',
    text: "On revient vers vous pour un dernier merci, et pour recueillir vos premiers souvenirs de la soirée." },
];

function TimelineStep({ index, total, when, title, text, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: highlight ? 'var(--lime)' : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${highlight ? 'var(--lime)' : 'rgba(255,255,255,0.18)'}`,
          color: highlight ? '#0d1b2a' : 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 15,
        }}>
          {index + 1}
        </div>
        {index < total - 1 && (
          <div style={{
            width: 2, flex: 1, minHeight: 24, marginTop: 6,
            background: 'linear-gradient(to bottom, rgba(184,239,11,0.3), rgba(255,255,255,0.06))',
          }} />
        )}
      </div>
      <div style={{ paddingBottom: 36 }}>
        <div style={{
          display: 'inline-block', color: 'var(--lime)', fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
          marginBottom: 6,
        }}>
          {when}
        </div>
        <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 19, marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 460 }}>
          {insecable(text)}
        </p>
      </div>
    </div>
  );
}

// Mêmes avis réels que /mariage (voir MariageClient.js) — jamais reformulés.
const TESTIMONIALS = [
  { name: 'Alexis et Ozanne', event: 'Mariage', stars: 5, source: 'Google', date: 'Août 2026',
    text: "C'est super agréable d'avoir Myrio à ses côté pour un mariage, il s'adapte vite, et est très attachant, merci pour tout je recommande !" },
  { name: 'Elsa', event: "Mariage d'Alexis & Ozanne", stars: 5, source: 'Google', date: 'Août 2026',
    text: "Myrio est un dj exceptionnel, il s'adapte parfaitement à son public et est bienveillant. Nous sommes ravis de notre mariage! Merci Myrio !!!!" },
  { name: 'Carine et Sébastien', event: 'Mariage', stars: 5, source: 'Google', date: 'Juillet 2026',
    text: "Un immense merci à Myrio et sa femme Virginie qui nous ont clairement sauvé notre mariage. 2 semaines avant notre DJ initial nous a informé qu'il ne s'assurerait pas la prestation (pour des raisons de santé) et Myrio a été incroyable et rassurant. 2 semaines pour se caler avec nous et l'animation a été parfaite. Nous n'aurions pas pu espérer mieux. Vous voulez un évènement réussi en terme d'animation, Travaillez avec Myrio!" },
  { name: 'Treecy et Jerry', event: 'Mariage', stars: 5, source: 'Google', date: 'Mai 2026',
    text: "C'est un dj très professionnel, compréhensif et qui s'adapte à toutes situations. Le rapport qualité prix est au top. Je recommande fortement. Amusement garantie." },
  { name: 'Sandra et Stéphanie', event: 'Mariage', stars: 5, source: 'mariages.net',
    text: "Myrio a été à l'écoute de nos envies, on a tout calé ensemble. Ces propositions ont été pertinentes. Nous l'avions déjà vu comme dj dans des soirées repas d'entreprise et comme nous l'avions apprécié nous l'avons contacté pour notre mariage. Il est en plus super bien équipé en matériel du coup ça facilite pour faire des animations tout au long de la soirée." },
];

const LEGAL_LINKS = [
  { href: '/mentions-legales',          label: 'Mentions légales' },
  { href: '/cgv',                       label: 'Conditions générales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
];

const FAQ = [
  { q: "Comment être sûr que la musique correspondra à nos goûts ?",
    a: "Tout commence par notre échange sur vos goûts et l'ambiance souhaitée. Vous ajoutez ensuite vos coups de cœur et vos interdits dans votre espace en ligne, seuls ou avec vos proches grâce à une playlist partagée : quelques repères suffisent. Myrio construit la soirée à partir de là, puis l'adapte en direct selon la réaction de la piste." },
  { q: "Que se passe-t-il en cas de problème technique le jour du mariage ?",
    a: "Nous utilisons du matériel professionnel et prévoyons un plan de secours. Un technicien est présent du début à la fin de la prestation. Si un incident survient, il est pris en charge par notre équipe, sans que vous ayez à intervenir." },
  { q: "Serons-nous accompagnés tout au long des préparatifs ?",
    a: "Oui. Vous avez un interlocuteur unique, du premier échange jusqu'au jour J. Nous organisons un point régulier avant l'événement, avec le déroulé, les playlists et les contraintes du lieu." },
  { q: "Quelle est la prestation incluse ?",
    a: "Le contenu dépend de vos besoins et de votre lieu. Il est défini ensemble lors de l'échange, puis détaillé dans une proposition personnalisée. Les options possibles incluent le DJ, la sonorisation, l'éclairage, la vidéo, le photobooth et le livre d'or." },
  { q: "Quel est le budget minimum ?",
    a: "Nos prestations démarrent à partir de 2 000 €. Le montant final dépend du lieu, de la durée et des options choisies." },
  { q: "Comment se passe la réservation ?",
    a: "Après notre échange, nous vous envoyons une proposition. Votre date est réservée à réception de l'acompte de 50 % et du contrat signé. Une date réservée n'est plus proposée à d'autres couples." },
  { q: "Intervenez-vous hors de la région ?",
    a: "Nous intervenons principalement en Pays de la Loire — Nantes, Angers, Rennes, Saint-Nazaire et leurs environs. Pour un lieu plus éloigné, contactez-nous : les frais de déplacement sont précisés dans la proposition." },
  { q: "Peut-on modifier la prestation après la réservation ?",
    a: "Oui, dans les conditions prévues par nos conditions générales de vente. Toute modification est confirmée par écrit." },
  { q: "Quand faut-il réserver ?",
    a: "Il n'y a pas de délai fixe. Nous vous conseillons toutefois de nous contacter 12 à 18 mois à l'avance, surtout pour les samedis de la saison. Les dates disponibles évoluent selon les réservations." },
];

const TYPEWRITER_WORDS = [
  'Une ambiance qui vous ressemble',
  'Zéro gestion technique le jour J',
  'Des souvenirs qui restent en images et en son',
  'Une soirée dont vous profitez vraiment',
];

/* Destination et nom de suivi des boutons. Par défaut, ceux de /mariage-sans-stress. Une porte
   d'entrée (portes.js) y met les siens : le formulaire sait alors par quelle page on est arrivé. */
const CTA_DEFAUT = { href: '/devis/mariage-contact', suivi: 'mariage_sans_stress' };
const CtaContext = createContext(CTA_DEFAUT);

function CtaButton({ children = 'Vérifier la disponibilité de ma date →', style, location = 'autre' }) {
  const { href, suivi } = useContext(CtaContext);
  return (
    <a href={href} className="mss-focusable" onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: `${suivi}_cta_${location}` })} style={{
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

function Typewriter({ words }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2200);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <span style={{ color: 'var(--lime)' }}>
      {words[index]}
    </span>
  );
}

const NAV_LINKS = [
  { href: '#approche', label: 'Notre approche' },
  { href: '#avis',     label: 'Avis' },
  { href: '#services', label: 'Nos services' },
  { href: '#faq',      label: 'FAQ' },
];

/* `porte` : clé d'une porte d'entrée (portes.js), ou rien pour la page d'origine. Sans porte,
   le rendu est strictement celui d'avant — c'est la page qui reçoit les pubs « dj mariage ». */
export default function MariageSansStressClient({ porte = null }) {
  const p = porte ? PORTES[porte] : null;
  const cta = p ? { href: `/devis/mariage-contact?porte=${p.slug}`, suivi: p.suivi } : CTA_DEFAUT;
  // Sur une porte, le premier lien du menu mène au bloc dédié (à la place de « Notre approche »).
  const navLinks = p ? [{ href: `#${p.section.id}`, label: p.navLabel }, ...NAV_LINKS.slice(1)] : NAV_LINKS;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef(null);
  /* Vidéo du héro choisie côté client : version recadrée/compressée (~1 Mo) sur mobile, originale
     (5 Mo) sur ordinateur. Rien n'est téléchargé avant ce choix (l'image de fond s'affiche en attendant),
     ni du tout si "réduire les animations" est activé. */
  const [heroVideoSrc, setHeroVideoSrc] = useState(null);
  const [bannerPhotoRef, bannerPhotoBg] = useLazyBackground('/Ban_bretignolle.jpg');
  const [avisRef, avisBg] = useLazyBackground('/ban_mariage_sans-stress-3.jpg');
  const [parcoursRef, parcoursBg] = useLazyBackground('/ban_prestation_son.webp');
  const [ctaFinalRef, ctaFinalBg] = useLazyBackground('/ban_mariage_sans-stress-2.jpg');
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setHeroVideoSrc(window.matchMedia?.('(max-width: 640px)').matches
      ? '/ban_mariage_sans-stress-mobile.mp4'
      : '/ban_mariage_sans-stress.mp4');
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <CtaContext.Provider value={cta}>
    <div className="mss-page">
      {/* Image du héro mobile demandée en priorité, avant les photos plus bas dans la page */}
      <link rel="preload" as="image" href="/ban_mariage_sans-stress-mobile.webp" media="(max-width: 640px)" fetchPriority="high" />
      <style>{`
${MARIAGE_BLOCS_CSS}
        @media (prefers-reduced-motion: reduce) {
          .mss-hero-video { display: none !important; }
        }
        .mss-page section[id] { scroll-margin-top: 64px; }
        .mss-hero-voile {
          background: linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.55) 60%,rgba(13,27,42,0.2) 100%);
        }
        .mss-nav-lien {
          color: rgba(255,255,255,0.78);
          font-size: 14px;
          font-family: var(--font-display), sans-serif;
          text-decoration: none;
          transition: color 0.2s;
        }
        .mss-nav-lien:hover { color: var(--lime); }
        .mss-stats {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 32px;
        }
        .mss-engagement {
          box-sizing: border-box;
          max-width: 760px;
          margin: 0 auto;
          padding: clamp(28px,5vw,48px);
          text-align: center;
          border-radius: 20px;
          background: var(--card);
          border: 1px solid color-mix(in srgb, var(--lime) 30%, transparent);
        }
        @media (max-width: 640px) {
          .mss-hero-voile {
            background: linear-gradient(to bottom,rgba(13,27,42,0.2) 0%,rgba(13,27,42,0.66) 30%,rgba(13,27,42,0.86) 100%);
          }
          .mss-stats { gap: 12px; }
          .mss-stats > div { padding: 0 !important; }
        }
        @media (max-width: 640px) {
          .mss-hero { background-image: url(/ban_mariage_sans-stress-mobile.webp) !important; }
        }
        .mss-hero {
          min-height: 100vh;
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }
        .mss-hero > .mss-hero-content {
          width: 100%;
        }
        @media (max-width: 768px) {
          .mss-hero-h1 { margin-bottom: 32px !important; }
          .mss-hero-subtitle { margin-bottom: 40px !important; }
          .mss-hero-typewriter { margin-bottom: 44px !important; }
        }
      `}</style>

      {/* ── EN-TÊTE ─────────────────────────────────────────────── */}
      <div ref={barRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{
          background: (scrolled || menuOpen) ? 'rgba(6,14,22,0.85)' : 'transparent',
          backdropFilter: (scrolled || menuOpen) ? 'blur(12px)' : 'none',
          borderBottom: (scrolled || menuOpen) ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}>
        <div style={{
          padding: '14px 32px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <Image src="/logo.png" alt="Myracoustic" width={77} height={38} style={{ height: 38, width: 'auto' }} priority />
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="mss-focusable mss-nav-lien">{l.label}</a>
            ))}
            <CtaButton location="header" style={{ padding: '9px 20px', fontSize: 13.5 }} />
          </nav>
          <button
            className="hide-desktop mss-focusable"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, margin: '-4px -4px -4px 0',
            }}
            aria-label="Menu" aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="hide-desktop" style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 32px 24px',
          }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="mss-focusable" onClick={() => setMenuOpen(false)} style={{
                display: 'block', color: 'rgba(255,255,255,0.8)',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 500, fontSize: 16,
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                textDecoration: 'none',
              }}>
                {l.label}
              </a>
            ))}
            <div style={{ marginTop: 16 }}>
              <CtaButton location="menu_mobile" style={{ display: 'block', textAlign: 'center', width: '100%' }} />
            </div>
          </div>
        )}
        </div>
      </div>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="mss-hero" style={{
        padding: 'clamp(66px,7vw,80px) 32px clamp(80px,10vw,120px)',
        backgroundImage: 'url(/ban_mariage_sans-stress.webp)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Vidéo en fond — absente si "réduire les animations" est activé,
            l'image de fond du <section> sert alors de secours statique. */}
        {heroVideoSrc && (
          <video
            className="mss-hero-video"
            autoPlay muted loop playsInline
            poster={heroVideoSrc.endsWith('-mobile.mp4') ? '/ban_mariage_sans-stress-mobile.webp' : '/ban_mariage_sans-stress.webp'}
            src={heroVideoSrc}
            style={{
              position: 'absolute', inset: 0, zIndex: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        )}
        <div className="mss-hero-voile" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.08) 0%,transparent 55%)',
        }} />

        <div className="mss-hero-content" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 620 }}>
            <SectionLabel>{p?.hero.label ?? 'DJ mariage'}</SectionLabel>
            <h1 className="mss-hero-h1" style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(34px,6vw,64px)', fontWeight: 700,
              lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 20,
            }}>
              {p ? insecable(p.hero.titre) : 'Des grands-parents aux copains, une piste pleine toute la nuit.'}
            </h1>
            <p className="mss-hero-subtitle" style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: 'clamp(16px,1.5vw,18px)', lineHeight: 1.75,
              marginBottom: 28, textShadow: '0 1px 14px rgba(13,27,42,0.7)',
            }}>
              {p ? insecable(p.hero.sousTitre) : <>Votre DJ mariage autour de Nantes, Rennes et Angers. Son, lumière et film de votre soirée&nbsp;: tout compris, un seul contact.</>}
            </p>
            <p className="mss-hero-typewriter" style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(16px,2vw,20px)', fontWeight: 700,
              lineHeight: 1.3, marginBottom: 36, minHeight: 56,
            }}>
              <Typewriter words={TYPEWRITER_WORDS} />
            </p>
            {/* Sur mobile, un seul CTA accessible en permanence (barre fixe en bas) —
                celui-ci ferait doublon avec elle, retiré sur ce breakpoint. */}
            <div className="hide-mobile"><CtaButton location="hero" /></div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 2 }}>
          <AnimatedWave bars={60} height={80} opacity={0.6} />
        </div>
      </section>

      {/* ── PORTE D'ENTRÉE (pages application, film, photobooth) ── */}
      {p && <PorteSection porte={p} cta={<CtaButton location="porte" />} />}

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(44px,7vw,72px) 32px', background: '#060e16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal className="mss-stats">
          <StatItem value="26" suffix="+" label="Années d'expérience" />
          <StatItem value="200" suffix="+" label="Mariages orchestrés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
      </section>

      {/* ── BANNIÈRE PHOTO ──────────────────────────────────────── */}
      <div ref={bannerPhotoRef} style={{
        height: 'clamp(220px,32vw,420px)',
        backgroundImage: bannerPhotoBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* ── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <BlocApproche />

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section id="avis" ref={avisRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: avisBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Ce que disent les couples que nous avons accompagnés
            </h2>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
          <div className="hide-mobile" style={{ textAlign: 'center', marginTop: 36 }}>
            <CtaButton location="avis" />
          </div>
        </Reveal>
      </section>

      {/* ── QUI SOMMES-NOUS ─────────────────────────────────────── */}
      {/* « Vous êtes seul ou plusieurs ? » revient dans 3 premiers appels sur 9 (Plaud, 03/11). */}
      <BlocQuiSommesNous />

      {/* ── GALERIE ─────────────────────────────────────────────── */}
      {/* Suite directe de « Qui sommes-nous » (même fond) : une carte par couple, demandé par Myrio le 03/11. */}
      <BlocGalerie />

      {/* ── SERVICES ────────────────────────────────────────────── */}
      <BlocServices cta={<div className="hide-mobile" style={{ marginTop: 28 }}><CtaButton location="services" /></div>} />

      {/* ── PARCOURS D'ACCOMPAGNEMENT ───────────────────────────── */}
      <section id="parcours" ref={parcoursRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: parcoursBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <Reveal style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Votre accompagnement</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Du premier contact au <span style={{ color: 'var(--lime)' }}>jour&nbsp;J</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
              Sur la base d&apos;un mariage organisé un an à l&apos;avance, voici comment se déroule un accompagnement Myracoustic, étape par étape.
            </p>
          </Reveal>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {JOURNEY.map((step, i) => (
              <Reveal key={i}>
                <TimelineStep index={i} total={JOURNEY.length} {...step} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTRE ENGAGEMENT (garantie allégée) ─────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal className="mss-engagement">
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
          }}>
            <ShieldCheck size={22} color="var(--lime)" />
          </div>
          <SectionLabel style={{ justifyContent: 'center' }}>Notre engagement</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>
            {ENGAGEMENT_SERENITE.title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8 }}>
            {ENGAGEMENT_SERENITE.text}
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>FAQ</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Vos questions, nos réponses
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...(p?.faq ?? []), ...FAQ].map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </Reveal>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section ref={ctaFinalRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        backgroundImage: ctaFinalBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg,rgba(13,27,42,0.9) 0%,rgba(26,5,16,0.9) 50%,rgba(13,27,42,0.9) 100%)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, marginBottom: 12 }}>
            Prêts à vivre le mariage <span style={{ color: 'var(--lime)' }}>de vos rêves</span>&nbsp;?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 32 }}>
            Un devis personnalisé, sans engagement.
          </p>
          <div className="hide-mobile"><CtaButton location="final" style={{ padding: '16px 40px', fontSize: 17 }}>Demander mon devis</CtaButton></div>
        </Reveal>
      </section>

      {/* ── PIED DE PAGE ────────────────────────────────────────── */}
      <div style={{ padding: '22px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
            © 2026 Myracoustic.
          </p>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="mss-focusable" style={{
              color: 'var(--text-muted)', fontSize: 13, padding: '8px 0',
              textDecoration: 'underline', textDecorationColor: 'var(--separator)',
              transition: 'color 0.2s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new Event('myra-cookie-prefs'))}
            className="mss-focusable"
            style={{
              color: 'var(--text-muted)', fontSize: 13, background: 'none', border: 'none', padding: '8px 0',
              cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--separator)',
              transition: 'color 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Préférences cookies
          </button>
        </div>
      </div>

      {/* Réserve l'espace occupé par la barre CTA fixe mobile, pour qu'elle ne masque pas le pied de page */}
      <div className="hide-desktop" style={{ height: 70 }} />

      {/* ── CTA FIXE MOBILE ─────────────────────────────────────── */}
      {/* Sur mobile, le CTA du header est caché dans le menu hamburger : sans cette barre,
          plus aucune action n'est visible une fois le hero dépassé. */}
      <div className="hide-desktop" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'rgba(6,14,22,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <CtaButton location="barre_mobile" style={{ display: 'block', textAlign: 'center', width: '100%' }} />
      </div>

    </div>
    </CtaContext.Provider>
  );
}
