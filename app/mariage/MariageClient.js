'use client';

import Link from 'next/link';
import { Sparkles, ShieldCheck, Download } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import { FAQ_ITEMS } from './faq-data';
import TestimonialCarousel from '../components/TestimonialCarousel';
import TestimonialCard from '../components/TestimonialCard';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { CITIES } from '../lib/cities';
import { gtagEvent } from '../lib/gtag';
import {
  FaqItem, useLazyBackground, ENGAGEMENT_SERENITE, MARIAGE_BLOCS_CSS,
  FondHeroMariage, HERO_MARIAGE_PHOTO, HERO_MARIAGE_CSS,
  BlocApproche, BlocQuiSommesNous, BlocGalerie, BlocServices,
} from '../components/MariageBlocs';

/* Page mariage principale (référencée, avec le menu et le pied de page du site). Depuis le 18/11,
   elle reprend les blocs de /mariage-sans-stress (approche, équipe, galerie, services, engagement
   « sérénité ») via components/MariageBlocs.js : un seul texte pour les deux pages. */

// Bouton unique de la page : même destination partout, un nom de suivi par emplacement.
function Cta({ location, style }) {
  return (
    <a href="/devis/mariage-contact" className="mss-focusable"
      onClick={() => gtagEvent('funnel_step', { profil: 'mariage', step_name: `mariage_cta_${location}` })}
      style={{
        background: 'var(--lime)', color: '#0d1b2a',
        padding: '15px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700,
        fontFamily: 'var(--font-display), sans-serif',
        textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
        textAlign: 'center', textWrap: 'balance',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      Vérifier la disponibilité de ma date →
    </a>
  );
}

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
          fontFamily: 'var(--font-display), sans-serif', fontSize: 11, fontWeight: 700,
          color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5,
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
    text: "Le déroulé est figé, le matériel est vérifié. Il ne vous reste plus qu'à profiter." },
  { when: 'Le jour J', title: 'Votre mariage, sans accroc',
    text: "26 ans d'expérience et plus de 200 mariages animés : on a déjà vu et géré l'imprévu, pour que votre journée se déroule sans accroc, quoi qu'il arrive en coulisses.",
    highlight: true },
  { when: '1 semaine après', title: 'Un dernier mot',
    text: "On revient vers vous pour un dernier merci, et pour recueillir vos premiers souvenirs de la soirée." },
];

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

// Les deux promesses de la section « Notre engagement ». La seconde vient de /mariage-sans-stress.
const ENGAGEMENTS = [
  { icon: Sparkles,
    title: "Votre soirée, pas notre catalogue",
    text: "Depuis votre espace personnel, vous construisez la musique et le déroulé de votre soirée avec nous — playlist, enchaînement des temps forts, ambiance. On vous conseille, on ne vous impose rien.",
    // /mariage est la page que Google connaît le mieux : ce lien aide la page de l'application à être trouvée.
    lien: { href: '/organisation-mariage', label: "Découvrir l'application pour organiser votre mariage →" } },
  { icon: ShieldCheck, ...ENGAGEMENT_SERENITE },
];

export default function MariageClient() {
  // Photos de fond posées seulement à l'approche du bloc, pour ne pas ralentir le haut de page.
  const [avisRef, avisBg] = useLazyBackground('/ban_mariage_sans-stress-3.jpg');
  const [parcoursRef, parcoursBg] = useLazyBackground('/ban_prestation_son.webp');

  return (
    <div className="mss-page">
      <style>{`
${MARIAGE_BLOCS_CSS}
${HERO_MARIAGE_CSS}
        .mss-hero {
          min-height: 100vh;
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }
        @media (max-width: 768px) {
          .mss-hero-h1 { margin-bottom: 32px !important; }
          .mss-hero-subtitle { margin-bottom: 40px !important; }
        }
        .mar-engagements {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          max-width: 940px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .mar-engagements { grid-template-columns: minmax(0, 1fr); gap: 14px; }
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="mss-hero" style={{
        padding: 'clamp(90px,8vw,110px) 32px clamp(90px,8vw,110px)',
        backgroundImage: HERO_MARIAGE_PHOTO,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <FondHeroMariage />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg,#1a050e 0%,#4a0e24 40%,#2a0a16 70%,#0d1b2a 100%)',
          opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 80% 40%,rgba(184,239,11,0.05) 0%,transparent 55%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2, width: '100%' }}>
          <SectionLabel>Mariage</SectionLabel>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(184,239,11,0.3)', background: 'rgba(184,239,11,0.06)',
          }}>
            <span style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' }}>★ 5/5 sur Google</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif' }}>200+ mariages animés</span>
          </div>
          <h1 className="mss-hero-h1" style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            VOTRE MARIAGE,<br /><span style={{ color: 'var(--lime)' }}>NOTRE MUSIQUE</span>
          </h1>
          <p className="mss-hero-subtitle" style={{
            color: 'rgba(255,255,255,0.88)',
            fontSize: 'clamp(15px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 520, marginBottom: 36, textShadow: '0 1px 14px rgba(13,27,42,0.7)',
          }}>
            Le jour où tout se joue. Nous orchestrons le son, la lumière et l&apos;émotion de votre cérémonie à la dernière danse — pour que vous n&apos;ayez qu&apos;à vivre l&apos;instant.
          </p>
          <Cta location="hero" />
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 14, fontFamily: 'var(--font-display), sans-serif', textShadow: '0 1px 10px rgba(13,27,42,0.8)' }}>
            Gratuit · sans engagement · réponse sous 24h
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
          <StatItem value="200" suffix="+" label="Mariages animés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
        <Reveal style={{ maxWidth: 720, margin: '40px auto 0', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.8 }}>
            Basé à Nort-sur-Erdre, à 25 minutes de Nantes, Myracoustic est un prestataire de sonorisation, éclairage, vidéo et animation DJ pour mariages en Pays de la Loire — Nantes, Angers, Rennes, Saint-Nazaire et leurs environs.
          </p>
        </Reveal>
      </section>

      {/* ── NOTRE APPROCHE (bloc commun) ────────────────────────── */}
      <BlocApproche />

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section ref={avisRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: avisBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Ils nous ont confié leur mariage
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
              Ils ont vécu cet accompagnement avant vous.
            </p>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
          <Reveal style={{ textAlign: 'center', marginTop: 44 }}>
            <Cta location="temoignages" style={{ padding: '15px 34px' }} />
          </Reveal>
        </Reveal>
      </section>

      {/* ── QUI SOMMES-NOUS + GALERIE (blocs communs) ───────────── */}
      <BlocQuiSommesNous />
      <BlocGalerie />

      {/* ── NOS SERVICES (bloc commun) ──────────────────────────── */}
      <BlocServices cta={<div style={{ marginTop: 28 }}><Cta location="services" /></div>} />

      {/* ── PARCOURS D'ACCOMPAGNEMENT ──────────────────────────────── */}
      <section ref={parcoursRef} style={{
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

      {/* ── NOTRE ENGAGEMENT ────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
          <div className="mar-engagements">
            {ENGAGEMENTS.map((e) => (
              <div key={e.title} className="mss-atout">
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <e.icon size={20} color="var(--lime)" aria-hidden="true" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 19, lineHeight: 1.25, marginBottom: 10 }}>
                  {e.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
                  {e.text}
                </p>
                {e.lien && (
                  <Link href={e.lien.href} className="mss-focusable" style={{
                    display: 'inline-flex', alignItems: 'center', minHeight: 44, marginTop: 8,
                    color: 'var(--lime)', fontSize: 15, fontWeight: 600,
                    textDecoration: 'underline', textUnderlineOffset: 4,
                  }}>
                    {e.lien.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Preuve vécue — vrai avis client, pas une promesse : phrase de transition
              explicite puis le même composant que la section Témoignages
              (étoiles, avatar, badge « Avis Google ») pour qu'on le reconnaisse
              immédiatement comme un témoignage réel, pas un argument marketing. */}
          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13.5,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '44px 0 20px',
          }}>
            Un client en parle mieux que nous
          </p>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <TestimonialCard {...TESTIMONIALS[2]} />
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

      {/* ── AIMANT : GUIDE GRATUIT ──────────────────────────────── */}
      <section style={{ padding: '0 32px 56px' }}>
        <Reveal style={{
          maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 20,
          background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.2)',
          borderRadius: 14, padding: '24px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(184,239,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Download size={19} color="var(--lime)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15.5, marginBottom: 3 }}>
                Pas encore décidé ? Téléchargez notre guide gratuit
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>
                7 questions à poser à tout prestataire DJ de mariage avant de signer.
              </div>
            </div>
          </div>
          <a href="/guide-dj-mariage" style={{
            flexShrink: 0, background: 'var(--lime)', color: '#0d1b2a',
            padding: '11px 22px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Recevoir le guide →
          </a>
        </Reveal>
      </section>

      {/* ── DJ MARIAGE PAR VILLE ────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px,6vw,72px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Votre DJ mariage local</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 700, marginBottom: 24 }}>
            DJ mariage près de chez vous
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {CITIES.map((c) => (
              <a key={c.slug} href={`/dj-mariage-${c.slug}`} style={{
                display: 'inline-block', padding: '10px 18px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display), sans-serif',
                fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)'; e.currentTarget.style.background = 'rgba(184,239,11,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}
              >
                DJ mariage {c.nom}
              </a>
            ))}
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
          Trois formules claires, un conseiller vous rappelle sous 24h pour finaliser votre devis.
        </p>
        <Cta location="final" style={{ padding: '16px 40px', fontSize: 17 }} />
        </Reveal>
      </section>

    </div>
  );
}
