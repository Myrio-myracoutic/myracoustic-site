'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cake, Heart, Users2, PartyPopper, Music, CheckCircle, Wrench, Sparkles, ShieldCheck,
} from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import { FAQ_ITEMS } from './faq-data';
import TestimonialCarousel from '../components/TestimonialCarousel';
import TestimonialCard from '../components/TestimonialCard';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { CITIES } from '../lib/cities';
import { gtagEvent } from '../lib/gtag';
import {
  FaqItem, useLazyBackground, MARIAGE_BLOCS_CSS, insecable,
  BlocQuiSommesNous, GalerieCartes, TelephoneApp, photoSrc,
} from '../components/MariageBlocs';

/* Page des particuliers (anniversaires, fêtes de famille, soirées privées). Refaite le 20/11 sur le
   modèle de /mariage, avec l'angle choisi par Myrio : « Tout le monde sur la piste » (une fête qui
   rassemble toutes les générations). Mêmes blocs que la page mariage (classes .mss-*, galerie,
   visionneuse, cadre de téléphone), textes propres aux fêtes.
   Règles : rien d'inventé (avis réels uniquement : l'ancien texte « Patricia.A » avait été rédigé
   par nous, il n'est pas repris), aucune mention du film souvenir (choix de Myrio, 20/11), aucun
   prix. Photos : soirée privée d'avril fournie par Myrio, et les 20 ans de mariage de Clarisse et
   Olivier (dossier Drive « Anniversaire de Mariage 20 ans »). */

// Fond de l'en-tête. Vidéo posée quand les fichiers existent dans public/ (null = photo seule).
const HERO = {
  photo: '/fetes-hero.webp',
  photoMobile: '/fetes-hero-mobile.webp',
  video: null,
  videoMobile: null,
};

// Bouton unique de la page : même destination partout, un nom de suivi par emplacement.
function Cta({ location, style }) {
  return (
    <a href="/devis/particulier" className="mss-focusable"
      onClick={() => gtagEvent('funnel_step', { profil: 'particulier', step_name: `particulier_cta_${location}` })}
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

// Lien-pastille du maillage interne (sonorisation par ville, page mariage).
function LienPastille({ href, children }) {
  return (
    <a href={href} className="mss-focusable" style={{
      display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '10px 18px', borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
      color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-display), sans-serif',
      fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)'; e.currentTarget.style.background = 'rgba(184,239,11,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </a>
  );
}

/* Vidéo d'en-tête choisie côté client : rien n'est téléchargé avant, ni du tout si « réduire les
   animations » est activé ou si aucune vidéo n'est déclarée dans HERO. */
function FondHero() {
  const [videoSrc, setVideoSrc] = useState(null);
  useEffect(() => {
    if (!HERO.video) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const mobile = window.matchMedia?.('(max-width: 640px)').matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- choix fait une seule fois, au montage
    setVideoSrc(mobile && HERO.videoMobile ? HERO.videoMobile : HERO.video);
  }, []);
  return (
    <>
      <link rel="preload" as="image" href={HERO.photoMobile} media="(max-width: 640px)" fetchPriority="high" />
      {videoSrc && (
        <video
          className="fet-hero-video"
          autoPlay muted loop playsInline
          poster={videoSrc === HERO.videoMobile ? HERO.photoMobile : HERO.photo}
          src={videoSrc}
          style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div className="fet-hero-voile" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
    </>
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
          fontFamily: 'var(--font-display), sans-serif', fontSize: 12, fontWeight: 700,
          color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5,
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

/* ─── Données ───────────────────────────────────────────────────── */

// « Parle à tout le monde » : les occasions, sans en inventer (anniversaire de mariage = Clarisse et Olivier).
const OCCASIONS = [
  { icon: Cake, title: 'Anniversaire',
    text: "18, 30, 50 ou 80 ans : une soirée à l'image de la personne que l'on fête." },
  { icon: Heart, title: 'Anniversaire de mariage',
    text: '10, 20 ou 50 ans de mariage, avec la musique de votre histoire.' },
  { icon: Users2, title: 'Fête de famille',
    text: 'Cousinade, retrouvailles : quand trois générations se retrouvent sur la même piste.' },
  { icon: PartyPopper, title: 'Soirée entre amis',
    text: 'Une vraie soirée dansante, dans la salle ou le jardin de votre choix.' },
];

const ATOUTS = [
  { icon: Users2, title: 'Toutes les générations sur la piste',
    text: "Un DJ qui lit la salle et passe d'une époque à l'autre : les tubes des grands-parents, des parents et des ados, pour que la piste reste pleine." },
  { icon: Music, title: 'Votre musique, et celle de vos invités',
    text: 'Vous préparez la playlist avec nous ; vos invités proposent leurs chansons avant la fête, par un simple QR code. Vous gardez le dernier mot.' },
  { icon: CheckCircle, title: 'Un seul interlocuteur',
    text: 'Son, lumière, DJ, installation et rangement : un seul numéro à retenir. Vous profitez de votre propre fête.' },
  { icon: Wrench, title: 'Matériel pro, plan de secours',
    text: "Du matériel professionnel, testé avant l'arrivée de vos invités, et des solutions de secours. Si quelque chose lâche, on le gère." },
];

// Avis réels uniquement (sources données par Myrio). Les fêtes d'abord, puis des mariages.
const TESTIMONIALS = [
  { name: 'Fanny Dupas', event: 'Soirée privée · 80 personnes', stars: 5, source: 'Google', date: 'Août 2026',
    text: "Un grand merci à Myrio pour une animation sans faille. A notre écoute, il a fait preuve d'une forte adaptabilité et a su mettre une ambiance au top. Un très bon professionnel et une belle personne qui plus est. Nous remercions également sa femme Virginie pour avoir préparé un rougail/saucisses de folie pour nos 80 convives avec une énergie incroyable et d'avoir pris également des vidéos et photos de la soirée pour des souvenirs inoubliables. Nous recommandons vivement ce professionnel...vous ne serez que ravis." },
  { name: 'Virginie.G', event: 'Anniversaire · 90 personnes', stars: 5, source: 'Bark',
    text: "J'ai fais appel à Myracoustic pour un anniversaire et nous avions été très satisfait de sa prestation. Personne a l'écoute, ambiance au top. Je recommande++++" },
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

// Galerie : une carte par fête (public/galerie/<slug>/<slug>-01.webp…, 1re photo = couverture).
const SOIREE_AVRIL = 'soiree-privee-salle-des-fetes';
const CLARISSE = 'clarisse-et-olivier';
const GALERIES_FETES = [
  { slug: SOIREE_AVRIL, titre: 'Soirée privée en salle des fêtes', photos: [
    'Invités qui dansent dans la fumée, sous des guirlandes de fanions colorés',
    'Piste pleine, bras levés et bracelets lumineux pendant la soirée',
    'Danseurs en bracelets lumineux sur la piste, sous les fanions de la salle',
    'Arrivée de la pièce montée sous les bougies étincelles, dans une lumière rouge',
    "Deux invités complices, serre-tête à oreilles de lapin, au bord de la piste",
    'Piste de danse pleine sous les lumières violettes et les fanions',
    'Deux invités dansent sous une lumière rouge',
  ] },
  { slug: CLARISSE, titre: 'Les 20 ans de mariage de Clarisse et Olivier', photos: [
    "Clarisse et Olivier sur une terrasse face à l'océan, pour leurs 20 ans de mariage",
    'Vue d’ensemble de la villa où sont réunis les invités de Clarisse et Olivier',
    'Invités réunis autour de la piscine pour les 20 ans de mariage de Clarisse et Olivier',
    'Piste de danse sous les lumières violettes, pour les 20 ans de mariage de Clarisse et Olivier',
    'Invités qui dansent sous les lumières orangées, pour les 20 ans de mariage de Clarisse et Olivier',
  ] },
];
const altDe = (slug, i) => GALERIES_FETES.find((g) => g.slug === slug).photos[i];

// Grandes lignes seulement, le détail se fait au téléphone. Options réelles : docs/grilles-tarifaires.md.
const SERVICES = [
  { label: 'Son', title: 'Un son qui porte, partout dans la salle',
    text: "Le système est choisi selon votre salle et votre nombre d'invités, installé et réglé avant leur arrivée, avec un technicien présent toute la soirée. Vous n'avez rien à gérer.",
    // Photo prise par Myrio avant l'arrivée des invités (Drive « Anniversaire David Landais »).
    photo: { slug: 'anniversaire-de-david', index: 0,
      alt: "Cabine DJ, enceintes et jeux de lumière installés dans la salle avant l'arrivée des invités, pour l'anniversaire de David" } },
  { label: 'Lumière', title: 'Une piste qui donne envie de danser',
    text: "L'éclairage d'ambiance de la piste est toujours inclus. Mise en lumière de la salle, couleurs de votre fête : chaque lumière est réglée pour votre lieu, et vos photos en profitent aussi.",
    photo: { slug: CLARISSE, index: 3 } },
  { label: 'Application', title: 'Votre fête se prépare dans votre téléphone',
    text: 'Dans votre espace Myracoustic, vous construisez le programme et les playlists de la soirée, à votre rythme. Vos invités proposent leurs chansons en scannant un QR code : à vous d’accepter ou de refuser.' },
  { label: 'Appareil photo jetable', title: 'Les photos de vos invités, au même endroit',
    text: 'Un QR code sur les tables, et chaque invité prend ses photos de la soirée avec son téléphone. Le lendemain, la galerie se dévoile à tout le monde.',
    photo: { slug: SOIREE_AVRIL, index: 4 } },
  { label: 'Temps forts', title: 'Discours, gâteau, surprises : chaque moment tombe juste',
    text: "Micros pour les discours, musique prête pour l'arrivée du gâteau ou une surprise, étincelles froides et karaoké en option : nous suivons votre programme, sans temps mort.",
    photo: { slug: SOIREE_AVRIL, index: 2 } },
];

const JOURNEY = [
  { when: 'Premier contact', title: 'On imagine votre soirée ensemble',
    text: "Vous nous indiquez votre date, votre lieu et le nombre d'invités. Nous vous rappelons sous 24h pour parler de votre fête : vos invités, vos envies, votre musique." },
  { when: 'Votre proposition', title: 'Une proposition sur mesure',
    text: 'Vous recevez une proposition claire et détaillée, à valider en ligne. Gratuite et sans engagement.' },
  { when: 'Réservation', title: 'Votre date est à vous',
    text: "Dès réception de l'acompte, votre date est bloquée et votre espace en ligne s'ouvre." },
  { when: 'Les semaines avant', title: 'Vous préparez à votre rythme',
    text: 'Programme, playlists, QR code pour vos invités : tout se prépare depuis votre téléphone, et nous restons joignables par message.' },
  { when: 'Le jour J', title: "Vous profitez, on s'occupe du reste",
    text: 'Nous arrivons en avance pour installer et régler le son. Myrio anime votre soirée et fait danser tout le monde, jusqu’à la dernière chanson.',
    highlight: true },
  { when: 'Le lendemain', title: 'Les souvenirs de vos invités',
    text: "Les photos prises par vos invités avec l'appareil photo jetable se dévoilent dans votre galerie, prêtes à être partagées." },
];

const ENGAGEMENTS = [
  { icon: Sparkles, title: 'Votre soirée, pas notre catalogue',
    text: 'Vous choisissez la musique et le déroulé de votre fête avec nous : playlists, temps forts, ambiance. On vous conseille, on ne vous impose rien.' },
  { icon: ShieldCheck, title: 'Votre fête, sans fausse note',
    text: 'Une fête ne se rejoue pas. Nous prévoyons tout en amont : matériel professionnel, systèmes de secours et équipe dédiée. Si un imprévu de notre fait venait perturber votre soirée, nous nous engageons à intervenir rapidement, selon les conditions prévues dans nos CGV.' },
];

const H2 = { fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 };

/* ─── Page ──────────────────────────────────────────────────────── */
export default function PrivesClient() {
  // Photos de fond posées seulement à l'approche du bloc, pour ne pas ralentir le haut de page.
  const [avisRef, avisBg] = useLazyBackground(photoSrc(SOIREE_AVRIL, 5, false));
  const [parcoursRef, parcoursBg] = useLazyBackground('/ban_prestation_son.webp');

  return (
    <div className="mss-page">
      <style>{`
${MARIAGE_BLOCS_CSS}
        .fet-hero {
          min-height: 100vh;
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }
        .fet-hero-voile {
          background: linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.6) 60%,rgba(13,27,42,0.25) 100%);
        }
        @media (max-width: 640px) {
          .fet-hero { background-image: url(${HERO.photoMobile}) !important; }
          .fet-hero-voile {
            background: linear-gradient(to bottom,rgba(13,27,42,0.25) 0%,rgba(13,27,42,0.7) 32%,rgba(13,27,42,0.9) 100%);
          }
        }
        @media (max-width: 768px) {
          .fet-hero-h1 { margin-bottom: 28px !important; }
          .fet-hero-sous-titre { margin-bottom: 36px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fet-hero-video { display: none !important; }
        }
        .fet-occasions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          max-width: 1180px;
          margin: 0 auto;
        }
        .fet-occasion {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 20px;
          border-radius: 14px;
          background: var(--card);
          border: 1px solid var(--separator);
        }
        @media (max-width: 1024px) {
          .fet-occasions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .fet-occasions { grid-template-columns: minmax(0, 1fr); gap: 12px; }
        }
        .fet-engagements {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          max-width: 940px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .fet-engagements { grid-template-columns: minmax(0, 1fr); gap: 14px; }
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="fet-hero" style={{
        padding: 'clamp(90px,8vw,110px) 32px',
        backgroundImage: `url(${HERO.photo})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <FondHero />
        {/* Teinte festive violette, propre à la page des fêtes (bordeaux sur les pages mariage). */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(135deg,#1a0a3d 0%,#4a1a8e 40%,#2a0d5e 70%,#0d1b2a 100%)',
          opacity: 0.22,
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2, width: '100%' }}>
          <SectionLabel>Anniversaires &amp; fêtes privées</SectionLabel>
          <div style={{
            display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 18,
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(184,239,11,0.3)', background: 'rgba(13,27,42,0.55)',
          }}>
            <span style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' }}>★ 5/5 sur Google</span>
            <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif' }}>1000+ événements animés</span>
          </div>
          <h1 className="fet-hero-h1" style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            TOUT LE MONDE<br /><span style={{ color: 'var(--lime)' }}>SUR LA PISTE</span>
          </h1>
          <p className="fet-hero-sous-titre" style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(16px,1.5vw,18px)', lineHeight: 1.75,
            maxWidth: 540, marginBottom: 36, textShadow: '0 1px 14px rgba(13,27,42,0.7)',
          }}>
            {insecable("Anniversaire, fête de famille, soirée entre amis : des enfants aux grands-parents, chacun trouve sa chanson. Vous recevez vos invités, nous faisons danser tout le monde.")}
          </p>
          <Cta location="hero" />
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 14, fontFamily: 'var(--font-display), sans-serif', textShadow: '0 1px 10px rgba(13,27,42,0.8)' }}>
            Gratuit · sans engagement · réponse sous 24h
          </p>
          {/* Les pubs « DJ + ville » amènent aussi des futurs mariés sur cette page : on les oriente. */}
          <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 10px rgba(13,27,42,0.8)' }}>
            Vous préparez un mariage ?{' '}
            <Link href="/mariage" className="mss-focusable" style={{
              color: 'var(--lime)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4,
              display: 'inline-flex', alignItems: 'center', minHeight: 44,
            }}>
              Découvrez notre accompagnement mariage →
            </Link>
          </p>
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
          <StatItem value="1000" suffix="+" label="Événements animés" />
          <StatItem value="5" suffix="★" label="Note sur Google" />
        </Reveal>
        <Reveal style={{ maxWidth: 720, margin: '40px auto 0', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.8 }}>
            Basé à Nort-sur-Erdre, à 25 minutes de Nantes, Myracoustic anime anniversaires, fêtes de famille et soirées privées en Pays de la Loire — Nantes, Angers, Rennes, Saint-Nazaire et leurs environs : sonorisation, éclairage et animation DJ.
          </p>
        </Reveal>
      </section>

      {/* ── OCCASIONS ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px 0' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 36px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Pour quelle occasion ?</SectionLabel>
            <h2 style={H2}>
              Chaque fête a son histoire, <span style={{ color: 'var(--lime)', display: 'inline-block' }}>et sa musique</span>
            </h2>
          </div>
          <div className="fet-occasions">
            {OCCASIONS.map((o) => (
              <div key={o.title} className="fet-occasion">
                <div style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <o.icon size={19} color="var(--lime)" aria-hidden="true" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 17, lineHeight: 1.25, marginBottom: 6 }}>
                    {o.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>
                    {insecable(o.text)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── NOTRE APPROCHE ──────────────────────────────────────── */}
      <section id="approche" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Notre approche</SectionLabel>
            <h2 style={H2}>
              Vous recevez, <span style={{ color: 'var(--lime)', display: 'inline-block' }}>on s&apos;occupe du reste</span>
            </h2>
          </div>
          <div className="mss-atouts">
            {ATOUTS.map((f) => (
              <div key={f.title} className="mss-atout">
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <f.icon size={20} color="var(--lime)" aria-hidden="true" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 18, lineHeight: 1.25, marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.65 }}>
                  {insecable(f.text)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section ref={avisRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: avisBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.9)' }} />
        <Reveal style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Ils en parlent</SectionLabel>
            <h2 style={H2}>Ils nous ont confié leur fête</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Anniversaires, soirées privées, mariages : ce que nos clients en disent.
            </p>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
          <Reveal style={{ textAlign: 'center', marginTop: 44 }}>
            <Cta location="temoignages" style={{ padding: '15px 34px' }} />
          </Reveal>
        </Reveal>
      </section>

      {/* ── QUI SOMMES-NOUS (bloc commun) + GALERIE DES FÊTES ───── */}
      <BlocQuiSommesNous />
      <section style={{ padding: '0 32px clamp(56px,7vw,88px)', background: 'var(--bg-dark)' }}>
        <Reveal style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h3 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.2vw,22px)', fontWeight: 700,
            textAlign: 'center', marginBottom: 22,
          }}>
            Quelques fêtes que nous avons fait danser
          </h3>
          <GalerieCartes
            galeries={GALERIES_FETES}
            colonnes={GALERIES_FETES.length % 3 === 0 ? 3 : 2}
            sujet={(g) => `de la fête : ${g.titre}`}
          />
        </Reveal>
      </section>

      {/* ── NOS SERVICES ────────────────────────────────────────── */}
      <section id="services" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Nos services</SectionLabel>
            <h2 style={H2}>Tout ce que nous mettons en œuvre pour votre fête</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
              Chaque fête est différente&nbsp;: après un premier échange téléphonique, nous construisons avec vous une proposition sur mesure, adaptée à votre lieu, votre date et vos invités.
            </p>
          </Reveal>

          <div className="mss-splits">
            {SERVICES.map((s) => (
              <Reveal key={s.label} className="mss-split">
                {s.photo ? (
                  <div className="mss-split-photo">
                    {/* WebP déjà compressés à la bonne taille : pas d'optimisation Next à refaire */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoSrc(s.photo.slug, s.photo.index, false)}
                      srcSet={`${photoSrc(s.photo.slug, s.photo.index, true)} 640w, ${photoSrc(s.photo.slug, s.photo.index, false)} 1366w`}
                      sizes="(max-width: 768px) 100vw, 520px"
                      alt={s.photo.alt ?? altDe(s.photo.slug, s.photo.index)}
                      width={1366} height={912} loading="lazy" decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                ) : (
                  <TelephoneApp />
                )}
                <div>
                  <p style={{
                    fontFamily: 'var(--font-mono), monospace', fontSize: 12, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 12,
                  }}>
                    {s.label}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 'clamp(21px,2.4vw,27px)', lineHeight: 1.2, marginBottom: 12 }}>
                    {insecable(s.title)}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.75 }}>
                    {insecable(s.text)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal style={{ textAlign: 'center', marginTop: 'clamp(48px,7vw,72px)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 640, margin: '0 auto 28px' }}>
              Vidéoprojecteur, mur LED, étincelles froides, karaoké&nbsp;: nous en parlons ensemble lors de notre échange.
            </p>
            <Cta location="services" />
          </Reveal>
        </div>
      </section>

      {/* ── PARCOURS ────────────────────────────────────────────── */}
      <section ref={parcoursRef} style={{
        padding: 'clamp(56px,7vw,88px) 32px',
        backgroundImage: parcoursBg,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(6,14,22,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <Reveal style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Comment ça se passe</SectionLabel>
            <h2 style={H2}>
              Du premier appel à la <span style={{ color: 'var(--lime)' }}>dernière chanson</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
              Voici comment se prépare votre fête avec Myracoustic, étape par étape.
            </p>
          </Reveal>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {JOURNEY.map((step, i) => (
              <Reveal key={step.when}>
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
            <h2 style={H2}>Ce qui ne change jamais</h2>
          </div>
          <div className="fet-engagements">
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
                  {insecable(e.text)}
                </p>
              </div>
            ))}
          </div>

          {/* Preuve vécue : un vrai avis de soirée privée, avec le même composant que plus haut. */}
          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.62)', fontSize: 13.5,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '44px 0 20px',
          }}>
            Nos clients en parlent mieux que nous
          </p>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <TestimonialCard {...TESTIMONIALS[0]} />
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Questions fréquentes</SectionLabel>
            <h2 style={H2}>Vous avez des questions&nbsp;?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Les réponses aux questions que l&apos;on nous pose le plus pour un anniversaire ou une soirée privée.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>
        </Reveal>
      </section>

      {/* ── PRÈS DE CHEZ VOUS ───────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px,6vw,72px) 32px', background: '#060e16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Myracoustic près de chez vous</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 700, marginBottom: 24 }}>
            Explorez nos prestations
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {CITIES.map((c) => (
              <LienPastille key={c.slug} href={`/sonorisation-${c.slug}`}>Sonorisation à {c.nom}</LienPastille>
            ))}
            <LienPastille href="/mariage">DJ et sonorisation de mariage</LienPastille>
          </div>
        </Reveal>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,7vw,88px) 32px', textAlign: 'center',
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2260 50%,#0d1b2a 100%)',
        borderTop: '1px solid rgba(184,239,11,0.18)',
      }}>
        <Reveal>
          <AnimatedWave bars={48} height={50} style={{ maxWidth: 560, margin: '0 auto 28px' }} opacity={0.55} />
          <h2 style={{ ...H2, fontSize: 'clamp(26px,3.5vw,44px)' }}>
            {insecable('Votre date est-elle encore libre ?')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 32 }}>
            Dites-nous votre date&nbsp;: nous vous rappelons sous 24h pour imaginer votre soirée.
          </p>
          <Cta location="final" style={{ padding: '16px 40px', fontSize: 17 }} />
        </Reveal>
      </section>

    </div>
  );
}
