'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Music, CheckCircle, Wrench, Users2, Phone, Sparkles, Menu, X } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import TestimonialCarousel from '../components/TestimonialCarousel';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';

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
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 460 }}>
          {text}
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

const FEATURES = [
  { icon: Music, title: 'Ambiance personnalisée & sur mesure',
    text: "Une playlist construite avec vous : vos goûts, vos souvenirs, l'ambiance que vous imaginez." },
  { icon: CheckCircle, title: 'Coordination technique globale',
    text: "Un seul interlocuteur pour le son, la lumière, le DJ et la vidéo. Vous n'avez plus à coordonner vos prestataires." },
  { icon: Wrench, title: 'Matériel son & lumière premium',
    text: "Du matériel professionnel et un plan de secours. Si quelque chose lâche, on le gère." },
  { icon: Users2, title: 'DJ expert en ambiance multigénérationnelle',
    text: "Un DJ qui lit la salle et adapte la musique pour que la piste reste pleine, toutes générations confondues." },
];

// Tous les services réunis, sans distinction de formule ni de prix — l'offre exacte
// (durée, options retenues) se construit par téléphone selon le besoin du client.
// Regroupés par catégorie pour montrer l'étendue réelle de l'offre.
const SERVICE_CATEGORIES = [
  { icon: Wrench, title: 'Son, lumière & vidéo', items: [
    'DJ & animation musicale, adaptés à la durée et à l’ambiance de votre soirée',
    'Sonorisation adaptée au nombre d’invités',
    'Éclairage piste de danse & mise en lumière de la salle',
    'Vidéoprojecteur ou mur LED',
    'Effets spéciaux : fumée lourde, étincelles froides',
    'Sonorisation & gestion technique de la cérémonie (laïque, religieuse, symbolique)',
    'Coordination du déroulé & sonorisation du vin d’honneur',
    'Installation, désinstallation & technicien dédié',
  ] },
  { icon: Sparkles, title: 'Animations & souvenirs', items: [
    'Photobooth',
    'Livre d’or vidéo & audio',
    { type: 'video', title: 'Captures vidéo professionnelles', steps: [
      'Captation continue, de notre arrivée jusqu’à la dernière danse',
      'Montage d’un film souvenir, offert aux mariés',
      'Partage de l’intégralité des fichiers bruts',
    ] },
  ] },
  { icon: Users2, title: 'Accompagnement & espace en ligne', items: [
    'Accompagnement personnalisé, du premier contact au jour J',
    'Gestion proactive des imprévus',
    'Suivi en temps réel avec votre équipe dédiée le jour J',
    'Playlists & programmation musicale',
    'Déroulé de la soirée',
    'Invités & informations pratiques',
    'Suivi de votre projet à deux, au même endroit',
  ] },
];

const FAQ = [
  { q: "Comment être sûr que la musique correspondra à nos goûts ?",
    a: "Nous commençons par un échange et un questionnaire sur vos goûts, vos souvenirs et l'ambiance souhaitée. La playlist est construite à partir de ces éléments. Le jour J, notre DJ adapte la musique en direct selon la réaction de la piste." },
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
    a: "Nous conseillons de réserver 12 à 18 mois à l'avance, surtout pour les samedis de la saison. Les dates disponibles évoluent selon les réservations." },
];

const TYPEWRITER_WORDS = [
  'Une ambiance qui vous ressemble',
  'Zéro gestion technique le jour J',
  'Des souvenirs qui restent en images et en son',
  'Une soirée dont vous profitez vraiment',
];

function CtaButton({ children = 'Vérifier la disponibilité de ma date →', style, location = 'autre' }) {
  return (
    <a href="/devis/mariage-contact" className="mss-focusable" onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: `mariage_sans_stress_cta_${location}` })} style={{
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

function availabilityText(availability) {
  if (!availability) return 'Votre date part vite.';
  const { available, year } = availability;
  if (available === 0) return `Tous les samedis de la saison ${year} sont déjà réservés.`;
  if (available === 1) return `Plus qu'un seul samedi disponible sur la saison ${year}.`;
  if (available >= 20) return `Plus que 20 samedis disponibles sur la saison ${year}.`;
  return `Encore ${available} samedis disponibles sur la saison ${year}.`;
}

function AvailabilityBanner({ availability }) {
  return (
    <div style={{
      background: 'var(--lime)', color: '#0d1b2a', textAlign: 'center',
      padding: '10px 16px', fontSize: 13.5, fontWeight: 700,
      fontFamily: 'var(--font-display), sans-serif',
    }}>
      {availabilityText(availability)}
    </div>
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

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${open ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button onClick={() => setOpen((o) => !o)} className="mss-focusable" style={{
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

const NAV_LINKS = [
  { href: '#approche', label: 'Notre approche' },
  { href: '#avis',     label: 'Avis' },
  { href: '#services', label: 'Nos services' },
  { href: '#faq',      label: 'FAQ' },
];

export default function MariageSansStressClient({ availability }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef(null);
  const bannerRef = useRef(null);
  const [bannerHeight, setBannerHeight] = useState(0);
  useEffect(() => {
    if (!bannerRef.current) return;
    const update = () => setBannerHeight(bannerRef.current.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bannerRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div>
      <style>{`
        .mss-focusable:focus-visible {
          outline: 2px solid var(--lime);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mss-focusable { transition: none !important; }
        }
      `}</style>

      {/* ── BANDEAU DISPONIBILITÉ + EN-TÊTE ─────────────────────── */}
      {/* Regroupés dans un même bloc collant : le bandeau reste visible pendant le
          défilement, comme le CTA fixe en bas d'écran sur mobile. */}
      <div ref={barRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div ref={bannerRef}>
          <AvailabilityBanner availability={availability} />
        </div>
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
          <Image src="/logo.png" alt="Myracoustic" width={140} height={47} style={{ height: 38, width: 'auto' }} priority />
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="mss-focusable" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif' }}>{l.label}</a>
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
            aria-label="Menu"
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
            {NAV_LINKS.map((l) => (
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
      {/* Réserve l'espace occupé par le bandeau+en-tête fixe (hauteur mesurée dynamiquement :
          le bandeau peut passer sur 2 lignes sur les très petits écrans). */}
      <div style={{ height: bannerHeight }} />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(66px,7vw,80px) 32px clamp(80px,10vw,120px)',
        backgroundImage: 'url(/ban_mariage_sans-stress.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.55) 60%,rgba(13,27,42,0.2) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.08) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 620 }}>
            <SectionLabel>Mariage</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(34px,6vw,64px)', fontWeight: 700,
              lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 20,
            }}>
              Votre mariage, une soirée inoubliable pour vous et vos invités, sans aucun stress.
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.56)',
              fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
              marginBottom: 28,
            }}>
              Son, lumière, vidéo et DJ, pilotés de A à Z, pour que vous profitiez de chaque instant.
            </p>
            <p style={{
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

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section style={{ padding: '72px 32px', background: '#060e16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32,
        }}>
          <StatItem value="26" suffix="+" label="Années d'expérience" />
          <StatItem value="200" suffix="+" label="Mariages orchestrés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
      </section>

      {/* ── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <section id="approche" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Notre approche</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Une soirée coordonnée de A à Z, sans stress technique
            </h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 32,
            maxWidth: 1100, margin: '0 auto',
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <f.icon size={20} color="var(--lime)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, lineHeight: 1.7 }}>
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section id="avis" style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: 'url(/ban_mariage_sans-stress-3.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Ce que disent les couples que nous avons accompagnés
            </h2>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
        </Reveal>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────── */}
      <section id="services" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Nos services</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Tout ce que nous mettons en œuvre pour votre mariage
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7 }}>
              Chaque mariage est différent : après un premier échange téléphonique, nous construisons avec vous une proposition sur mesure, adaptée à votre lieu, votre date et vos besoins.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 32,
          }}>
            {SERVICE_CATEGORIES.map((cat, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '28px 26px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <cat.icon size={18} color="var(--lime)" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 18 }}>
                    {cat.title}
                  </h3>
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {cat.items.map((item, j) => {
                    if (typeof item === 'object' && item.type === 'video') {
                      return (
                        <li key={j} style={{
                          marginTop: 16, marginBottom: 6, paddingTop: 16,
                          borderTop: '1px solid rgba(255,255,255,0.08)',
                        }}>
                          <p style={{
                            fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14.5,
                            color: '#fff', marginBottom: 10,
                          }}>
                            {item.title}
                          </p>
                          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {item.steps.map((step, k) => (
                              <li key={k} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9,
                                color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.5,
                              }}>
                                <span style={{
                                  flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                                  background: 'rgba(184,239,11,0.15)', color: 'var(--lime)',
                                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 10.5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                                }}>
                                  {k + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </li>
                      );
                    }
                    return (
                      <li key={j} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 11,
                        color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.5,
                      }}>
                        <CheckCircle size={15} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                        {item}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="hide-mobile" style={{ textAlign: 'center', marginTop: 44 }}>
            <CtaButton location="services" />
          </div>
        </Reveal>
      </section>

      {/* ── PARCOURS D'ACCOMPAGNEMENT ───────────────────────────── */}
      <section id="parcours" style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: 'url(/ban_prestation_son.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <Reveal style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Votre accompagnement</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Du premier contact au <span style={{ color: 'var(--lime)' }}>jour J</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7 }}>
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
        <Reveal style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Notre engagement</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>
            Votre sérénité, notre priorité
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8 }}>
            Votre mariage ne se rejoue pas. Nous prévoyons tout en amont : matériel professionnel, systèmes de secours et équipe dédiée. Si un imprévu de notre fait venait perturber votre soirée, nous nous engageons à intervenir rapidement, selon les conditions prévues dans nos CGV.
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>FAQ</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, marginBottom: 12 }}>
              Vos questions, nos réponses
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ.map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </Reveal>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        backgroundImage: 'url(/ban_mariage_sans-stress-2.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg,rgba(13,27,42,0.9) 0%,rgba(26,5,16,0.9) 50%,rgba(13,27,42,0.9) 100%)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12 }}>
            Prêts à vivre le mariage de vos rêves ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
            Un devis personnalisé, sans engagement.
          </p>
          <div className="hide-mobile"><CtaButton location="final" children="Demander mon devis" style={{ padding: '16px 40px', fontSize: 17 }} /></div>
        </Reveal>
      </section>

      {/* ── PIED DE PAGE ────────────────────────────────────────── */}
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
  );
}
