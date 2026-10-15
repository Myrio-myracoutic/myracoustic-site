'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Music, CheckCircle, Wrench, Users2, Phone } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import TestimonialCarousel from '../components/TestimonialCarousel';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';

/* Landing page dédiée — persona "premier mariage, zéro stress technique".
   Même base visuelle que /dj-mariage et /mariage. CTA unifié vers le tunnel existant
   (/devis/mariage-contact) : pas de formulaire embarqué sur cette page, volontairement. */

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
    text: "Nous prenons le temps de comprendre vos envies, vos goûts musicaux pour une playlist et une ambiance qui vous ressemblent à 100%." },
  { icon: CheckCircle, title: 'Coordination technique globale',
    text: "Un seul interlocuteur pour toute la coordination technique (son, lumière, DJ, vidéo). Zéro stress, nous gérons tout de A à Z." },
  { icon: Wrench, title: 'Matériel son & lumière premium',
    text: "Matériel professionnel avec des systèmes de secours intégrés. Finis les problèmes techniques qui gâchent la fête." },
  { icon: Users2, title: 'DJ expert en ambiance multigénérationnelle',
    text: "Notre DJ sait lire le public et adapter la musique pour une piste de danse pleine, toutes générations confondues." },
];

const PRICING = [
  { key: 'festive', name: 'Ambiance Festive', price: 2000,
    description: 'Pour une célébration pleine de joie et de rythme, sans le superflu. L’essentiel pour une ambiance réussie.',
    items: [
      'DJ 6h',
      'Sonorisation adaptée au nombre d’invités',
      'Éclairage piste de danse',
      'Vidéoprojecteur / diaporama inclus',
      'Effets : fumée lourde + étincelles froides',
      'Installation & technicien',
      'Accès basique à la plateforme en ligne',
      { text: 'Captures vidéo professionnelles de la soirée (durée selon la présence du DJ 6h)', isNew: true },
    ] },
  { key: 'signature', name: 'Expérience Signature', featured: true, badge: 'Le plus choisi', price: 3000,
    description: 'L’expérience complète pour une soirée orchestrée avec élégance et sans limite, tout inclus.',
    items: [
      'DJ pour la soirée complète (sans limite d’heures)',
      'Éclairage piste de danse + mise en lumière de la salle',
      'Mur LED 2 m² inclus',
      'Photobooth inclus',
      'Livre d’or vidéo & audio inclus',
      'Technicien dédié & accompagnement prioritaire',
      'Accès complet à la plateforme en ligne',
      'Coordination du déroulé & sonorisation du vin d’honneur',
      'Sonorisation cérémonie laïque (option +190€)',
      { text: 'Captures vidéo professionnelles de l’intégralité de votre événement (selon la présence de l’équipe)', isNew: true },
    ] },
  { key: 'exception', name: 'Mariage d’Exception', price: 4000,
    description: 'Le summum du sur-mesure pour un mariage grandiose et totalement unique, géré dans les moindres détails.',
    items: [
      'Toutes les fonctionnalités Expérience Signature',
      'Sonorisation & gestion technique de toute cérémonie (laïque, religieuse, symbolique, etc.) incluse',
      'Prestation DJ illimitée en temps',
      'Accompagnement personnalisé par un Wedding Tech Coach dédié de A à Z (visualisation 3D, conseils experts)',
      'Gestion des imprévus proactive',
      'Accès Premium à la plateforme en ligne',
      'Suivi en temps réel, communication prioritaire avec l’équipe dédiée',
      'Mur LED sur-mesure & sonorisation multi-espace complète',
      { text: 'Captures vidéo professionnelles sur-mesure de l’intégralité de votre événement (selon la présence de l’équipe)', isNew: true },
    ] },
];

const FAQ = [
  { q: 'Comment assurez-vous que la musique corresponde à nos goûts et à l’ambiance désirée ?',
    a: 'Grâce à votre espace en ligne et des échanges approfondis, nous créons une playlist sur-mesure. Notre DJ sait aussi s’adapter en temps réel pour une piste de danse toujours pleine et une ambiance qui vous ressemble.' },
  { q: 'Que se passe-t-il en cas de problème technique le jour du mariage ?',
    a: 'Nous utilisons du matériel professionnel avec des systèmes de secours intégrés. Une équipe technique dédiée est présente pour assurer une fluidité irréprochable et gérer tout imprévu discrètement.' },
  { q: 'Serons-nous accompagnés et conseillés tout au long des préparatifs ?',
    a: 'Absolument. Nous vous offrons un accompagnement personnalisé et des conseils, du premier contact jusqu’au jour J, pour faire les meilleurs choix et anticiper chaque détail.' },
  { q: 'Comment être sûr que l’ambiance sera à la hauteur de nos attentes ?',
    a: 'Notre expertise repose sur une compréhension fine de vos attentes. Nous vous aidons à visualiser le rendu final et à concevoir une atmosphère unique qui marquera les esprits.' },
];

const TYPEWRITER_WORDS = ['Sérénité absolue', 'Ambiance sur-mesure', 'Fluidité technique', 'Souvenirs magiques'];

function CtaButton({ children = 'Vérifier la disponibilité de ma date →', style }) {
  return (
    <a href="/devis/mariage-contact" onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: 'mariage_sans_stress_cta' })} style={{
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

function Typewriter({ words }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
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

function PricingCard({ plan }) {
  return (
    <div style={{
      background: plan.featured ? 'rgba(184,239,11,0.05)' : 'var(--card)',
      border: `1px solid ${plan.featured ? 'var(--lime)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16, padding: '32px 28px', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {plan.badge && (
        <span style={{
          position: 'absolute', top: -13, left: 28, background: 'var(--lime)', color: '#0d1b2a',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 12,
          padding: '4px 12px', borderRadius: 20,
        }}>
          {plan.badge}
        </span>
      )}
      <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 4, marginTop: plan.badge ? 10 : 0 }}>
        {plan.name}
      </h3>
      <p style={{ fontFamily: 'var(--font-display), sans-serif', color: 'var(--lime)', fontWeight: 700, fontSize: 26, marginBottom: 10 }}>
        {plan.price.toLocaleString('fr-FR')}€ <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 14 }}>l&apos;événement</span>
      </p>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{plan.description}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: 28, flex: 1 }}>
        {plan.items.map((item, i) => {
          const isNew = typeof item === 'object';
          const text = isNew ? item.text : item;
          return (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12,
              color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.5,
            }}>
              <CheckCircle size={16} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                {isNew && (
                  <span style={{
                    background: 'rgba(184,239,11,0.15)', color: 'var(--lime)', fontSize: 10.5, fontWeight: 700,
                    fontFamily: 'var(--font-display), sans-serif', padding: '2px 7px', borderRadius: 4,
                    marginRight: 7, verticalAlign: 'middle',
                  }}>
                    NOUVEAU
                  </span>
                )}
                {text}
              </span>
            </li>
          );
        })}
      </ul>
      <CtaButton children="Demander un devis personnalisé" style={{ textAlign: 'center', width: '100%' }} />
    </div>
  );
}

export default function MariageSansStressClient({ availability }) {
  return (
    <div>

      {/* ── EN-TÊTE ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '14px 32px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'rgba(6,14,22,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Image src="/logo.png" alt="Myracoustic" width={140} height={47} style={{ height: 38, width: 'auto' }} priority />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <a href="#approche" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif' }}>Notre approche</a>
          <a href="#tarifs" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif' }}>Tarifs</a>
          <a href="#avis" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif' }}>Avis</a>
          <a href="#faq" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display), sans-serif' }}>FAQ</a>
          <CtaButton style={{ padding: '9px 20px', fontSize: 13.5 }} />
        </nav>
      </div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(80px,10vw,120px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg,#0d1b2a 0%,#152233 50%,#0d1b2a 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.06) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Mariage</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(34px,6vw,64px)', fontWeight: 700,
            lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 20,
          }}>
            Myracoustic : votre mariage, une émotion inoubliable, sans aucun stress.
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 620, margin: '0 auto 28px',
          }}>
            L&apos;architecte de votre ambiance sonore et lumineuse pour un événement qui vous ressemble, parfaitement orchestré.
          </p>
          <p style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(16px,2vw,20px)', fontWeight: 700,
            marginBottom: 36, minHeight: 28,
          }}>
            <Typewriter words={TYPEWRITER_WORDS} />
          </p>
          <CtaButton />
          <AvailabilityLine availability={availability} />
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
              L&apos;expérience Myracoustic : des solutions pour un mariage parfait
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

      {/* ── TARIFS ──────────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Tarifs</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Des formules pour un mariage à la hauteur de vos rêves
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7 }}>
              Choisissez l&apos;expérience Myracoustic qui fera de votre mariage un événement inoubliable, sans aucun compromis sur la qualité et la sérénité.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 28,
            maxWidth: 1100, margin: '0 auto',
          }}>
            {PRICING.map((plan) => <PricingCard key={plan.key} plan={plan} />)}
          </div>
        </Reveal>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section id="avis" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Leurs souvenirs de mariages inoubliables
            </h2>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
        </Reveal>
      </section>

      {/* ── NOTRE ENGAGEMENT (garantie allégée) ─────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Notre engagement</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>
            Votre sérénité, notre priorité
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8 }}>
            Votre mariage est un événement non reproductible. Nous mettons tout en œuvre — matériel professionnel, systèmes de secours, équipe dédiée — pour une ambiance mémorable et une fluidité technique irréprochable. Et si un imprévu de notre fait venait perturber votre soirée, nous nous engageons à intervenir immédiatement pour que la fête reprenne son cours, selon les conditions prévues dans nos conditions générales de vente.
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>FAQ</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, marginBottom: 12 }}>
              Vos questions, nos réponses : la sérénité avant tout
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
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a0510 50%,#0d1b2a 100%)',
        borderTop: '1px solid rgba(184,239,11,0.18)',
      }}>
        <Reveal>
          <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12 }}>
            Prêts à vivre le mariage de vos rêves, sans le moindre stress ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
            Un devis personnalisé, sans engagement, sous 48h.
          </p>
          <CtaButton children="Oui, je veux mon mariage inoubliable !" style={{ padding: '16px 40px', fontSize: 17 }} />
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

    </div>
  );
}
