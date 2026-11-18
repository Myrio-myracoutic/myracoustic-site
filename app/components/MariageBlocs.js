'use client';

/* Blocs communs aux pages mariage : /mariage (page principale, référencée) et
   /mariage-sans-stress (page d'arrivée des pubs, avec ses portes d'entrée). Textes validés par
   Myrio et photos réelles : une seule source pour les deux pages. Les classes .mss-* sont
   fournies par MARIAGE_BLOCS_CSS, à poser dans le <style> de la page (racine en .mss-page). */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music, CheckCircle, Wrench, Users2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionLabel } from './AnimatedWave';
import Reveal from './Reveal';

// Espace insécable devant la ponctuation double : jamais de « : » ou « ? » en début de ligne.
export const insecable = (texte) => texte.replace(/ ([:;?!])/g, ' $1');

// Photos réelles fournies par Myrio (03/11) : une galerie par couple, dans public/galerie/<slug>/,
// en WebP (<slug>-01.webp en grand, <slug>-01-mini.webp pour la carte). 1re photo = couverture.
export const GALERIES = [
  { slug: 'carine-et-sebastien', couple: 'Carine et Sébastien', photos: [
    "Première danse de Carine et Sébastien entre deux fontaines d'étincelles froides, sur un nuage de fumée lourde",
    "Entrée de Carine et Sébastien dans la salle, sous les applaudissements de leurs invités",
    "Cérémonie laïque en plein air de Carine et Sébastien, face à leurs invités",
    "Carine et Sébastien s'embrassent derrière leur gâteau illuminé de bougies étincelles",
  ] },
  { slug: 'ozanne-et-alexis', couple: 'Ozanne et Alexis', photos: [
    "Invités qui dansent et applaudissent autour des tables au mariage d'Ozanne et Alexis",
    "Salle de réception aux poutres apparentes, décorée pour le mariage d'Ozanne et Alexis",
    "Moment complice face à la caméra pendant le mariage d'Ozanne et Alexis",
    "Piste de danse pleine, bras levés, au mariage d'Ozanne et Alexis",
    "Invités qui dansent près d'un jeu de lumière au mariage d'Ozanne et Alexis",
  ] },
  { slug: 'clarisse-et-olivier', couple: 'Clarisse et Olivier', photos: [
    "Clarisse et Olivier sur une terrasse face à l'océan, entourés de fleurs blanches et bleues",
    "Vue d'ensemble de la villa où sont réunis les invités de Clarisse et Olivier",
    "Invités réunis autour de la piscine pour le mariage de Clarisse et Olivier",
    "Piste de danse sous les lumières violettes au mariage de Clarisse et Olivier",
    "Invités qui dansent sous les lumières orangées au mariage de Clarisse et Olivier",
  ] },
  // Tiret insécable (‑) : « J-Yves » ne doit pas se couper en fin de ligne sur téléphone.
  { slug: 'dominique-et-j-yves', couple: 'Dominique et J‑Yves', photos: [
    "Dominique et J-Yves à leur table, derrière une composition de roses blanches et bleues",
    "Invités réunis pour le cocktail du mariage de Dominique et J-Yves",
    "Invités qui lèvent les bras pendant le repas du mariage de Dominique et J-Yves",
    "Piste de danse sous les lumières au mariage de Dominique et J-Yves",
    "Dominique et J-Yves trinquent près du buffet de desserts",
  ] },
  { slug: 'chafika-et-michael', couple: 'Chafika et Michael', photos: [
    "Chafika et Michael dansent sous une lumière rouge, entourés de leurs invités",
    "Invités de tous âges sur la piste de danse du mariage de Chafika et Michael",
  ] },
];

export const photoSrc = (slug, i, mini) =>
  `/galerie/${slug}/${slug}-${String(i + 1).padStart(2, '0')}${mini ? '-mini' : ''}.webp`;

// « du mariage d'Ozanne », « du mariage de Carine »
const deCouple = (couple) => (/^[aeiouyâàéèêîïôûù]/i.test(couple) ? `d'${couple}` : `de ${couple}`);

// Fond plein : les boutons doivent rester visibles sur une photo claire (étincelles, plein jour).
const BOUTON_ROND = {
  width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--separator)', cursor: 'pointer',
  background: 'var(--card)', color: 'var(--text)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

/* Photos d'un couple en plein écran : flèches, clavier (← → Échap), glisser sur téléphone.
   Rendue dans document.body : le parent <Reveal> applique un transform qui décalerait un position:fixed. */
function Visionneuse({ galerie, index, onIndex, onClose }) {
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const total = galerie.photos.length;
  const prev = () => onIndex((index - 1 + total) % total);
  const next = () => onIndex((index + 1) % total);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; };
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndex((index - 1 + total) % total);
      if (e.key === 'ArrowRight') onIndex((index + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onIndex, onClose]);
  useEffect(() => {
    // Photo suivante préchargée : pas d'attente au clic sur la flèche.
    const img = new window.Image();
    img.src = photoSrc(galerie.slug, (index + 1) % total, false);
  }, [galerie.slug, index, total]);
  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label={`Photos du mariage ${deCouple(galerie.couple)}`}
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '64px 16px 24px',
      }}
    >
      <button ref={closeRef} onClick={onClose} aria-label="Fermer" className="mss-focusable"
        style={{ ...BOUTON_ROND, position: 'absolute', top: 12, right: 12 }}>
        <X size={22} />
      </button>
      {/* WebP déjà compressés à la bonne taille : pas d'optimisation Next à refaire */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={index} src={photoSrc(galerie.slug, index, false)} alt={galerie.photos[index]}
        width={1366} height={768} onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: 'calc(100vh - 150px)', width: 'auto', height: 'auto',
          objectFit: 'contain', borderRadius: 8,
        }}
      />
      <p onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
        {galerie.couple} — {index + 1} / {total}
      </p>
      {total > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Photo précédente" className="mss-focusable"
            style={{ ...BOUTON_ROND, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronLeft size={24} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Photo suivante" className="mss-focusable"
            style={{ ...BOUTON_ROND, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}

// Cadre de téléphone en CSS : l'animation de Myrio pourra remplacer la capture sans le refaire.
export function TelephoneApp() {
  return (
    <div className="mss-tel">
      <div className="mss-tel-ecran">
        <span className="mss-tel-ilot" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/app-playlist-propositions.webp" width={780} height={1688} loading="lazy" decoding="async"
          alt="Application Myracoustic sur téléphone : chansons proposées par les invités, à accepter ou refuser, au-dessus de la playlist de la soirée"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
      </div>
    </div>
  );
}

export function GalerieMariages() {
  const [ouverte, setOuverte] = useState(null); // { g: galerie, i: photo }
  const declencheur = useRef(null);
  const fermer = useCallback(() => {
    setOuverte(null);
    declencheur.current?.focus();
  }, []);
  const changerPhoto = useCallback((i) => setOuverte((o) => (o ? { ...o, i } : o)), []);
  return (
    <>
      <div className="mss-galerie-grid">
        {GALERIES.map((g, k) => (
          <button
            key={g.slug} type="button" className="mss-galerie-carte mss-focusable"
            aria-label={`Voir les ${g.photos.length} photos du mariage ${deCouple(g.couple)}`}
            onClick={(e) => { declencheur.current = e.currentTarget; setOuverte({ g: k, i: 0 }); }}
            style={{
              position: 'relative', padding: 0, border: '1px solid var(--separator)', borderRadius: 12,
              overflow: 'hidden', cursor: 'pointer', background: 'var(--card)', textAlign: 'left',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(g.slug, 0, true)} alt="" width={640} height={360} loading="lazy" decoding="async"
              srcSet={`${photoSrc(g.slug, 0, true)} 640w, ${photoSrc(g.slug, 0, false)} 1366w`}
              sizes="(max-width: 640px) 100vw, 540px"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <span style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 14px 12px',
              background: 'linear-gradient(to top, color-mix(in srgb, var(--bg-dark) 88%, transparent), transparent)',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span className="mss-galerie-titre"
                style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--text)' }}>
                {g.couple}
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{g.photos.length} photos</span>
            </span>
          </button>
        ))}
      </div>
      {ouverte && (
        <Visionneuse galerie={GALERIES[ouverte.g]} index={ouverte.i} onIndex={changerPhoto} onClose={fermer} />
      )}
    </>
  );
}

// Ordre tiré des appels Plaud (03/11) : la piste « pour toutes les générations » est la 1re attente
// des couples ; la panne de matériel n'a été évoquée spontanément par aucun d'eux.
export const FEATURES = [
  { icon: Users2, title: 'DJ expert en ambiance multigénérationnelle',
    text: "Un DJ qui lit la salle et adapte la musique pour que la piste reste pleine, toutes générations confondues." },
  { icon: Music, title: 'Ambiance personnalisée & sur mesure',
    text: "Une playlist construite avec vous : vos goûts, vos souvenirs, l'ambiance que vous imaginez." },
  { icon: CheckCircle, title: 'Coordination technique globale',
    text: "Un seul interlocuteur pour le son, la lumière, le DJ et la vidéo. Vous n'avez plus à coordonner vos prestataires." },
  { icon: Wrench, title: 'Matériel son & lumière premium',
    text: "Du matériel professionnel et un plan de secours. Si quelque chose lâche, on le gère." },
];

// Grandes lignes seulement, le détail se fait par téléphone. Valable pour toutes les formules (formules.js).
export const SERVICE_SPLITS = [
  { label: 'Son', title: 'Le son, géré de A à Z',
    text: "Installation, réglages, plan de secours, technicien présent du début à la fin : nous prenons tout en charge, pour un son adapté à votre lieu et à vos invités. Vous n'avez rien à gérer.",
    photo: { slug: 'ozanne-et-alexis', index: 4, position: 'right' } },
  { label: 'Lumière', title: 'Des lumières réglées pour votre salle',
    text: "Chaque lumière est placée et réglée selon votre lieu et vos couleurs, de la piste de danse à vos moments forts. Le rendu est plus beau dans la salle, comme sur vos photos et votre film.",
    photo: { slug: 'clarisse-et-olivier', index: 3 } },
  { label: 'Application', title: 'Vos playlists, dans votre téléphone',
    text: "Dans votre application Myracoustic, vous construisez vos playlists à deux, à votre rythme, en écoutant un extrait avant de choisir. Vos invités proposent leurs chansons : à vous d'accepter ou de refuser." },
  { label: 'Captation vidéo', title: 'Votre soirée, à revivre en film',
    text: "Nous filmons de notre arrivée jusqu'à la dernière danse, puis notre équipe monte votre film souvenir, offert sous un mois. Vous recevez aussi toutes les images tournées.",
    photo: { slug: 'ozanne-et-alexis', index: 2 } },
  { label: 'Cérémonie', title: "Votre cérémonie, entendue jusqu'au dernier rang",
    text: "Laïque, religieuse ou symbolique, en salle ou en plein air : chaque mot porte, et vos musiques d'entrée tombent juste.",
    photo: { slug: 'carine-et-sebastien', index: 2 } },
  { label: 'Temps forts', title: "Du vin d'honneur à la dernière danse, tout s'enchaîne",
    text: "Vin d'honneur, repas, discours, ouverture de bal : nous suivons votre déroulé, sans temps mort.",
    photo: { slug: 'dominique-et-j-yves', index: 2 } },
];

/* Image de fond posée seulement à l'approche du bloc (~1 écran avant), pour ne pas
   concurrencer le héro au chargement. Sans IntersectionObserver : chargée tout de suite. */
export function useLazyBackground(url) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); obs.disconnect(); }
    }, { rootMargin: '100% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible ? `url(${url})` : 'none'];
}

export function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${open ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mss-focusable" style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '18px 22px', color: '#fff',
        fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 600,
      }}>
        {insecable(q)}
        <span aria-hidden="true" style={{
          flexShrink: 0, color: open ? 'var(--lime)' : 'var(--text-muted)',
          fontSize: 20, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
        }}>+</span>
      </button>
      <div className="mss-faq-reponse" data-open={open}>
        <div>
          <p style={{ margin: 0, padding: '0 22px 20px', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
            {insecable(a)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Engagement « sérénité » (garantie allégée) : même texte sur les deux pages.
export const ENGAGEMENT_SERENITE = {
  title: "Votre sérénité, notre priorité",
  text: "Votre mariage ne se rejoue pas. Nous prévoyons tout en amont : matériel professionnel, systèmes de secours et équipe dédiée. Si un imprévu de notre fait venait perturber votre soirée, nous nous engageons à intervenir rapidement, selon les conditions prévues dans nos CGV.",
};

export const MARIAGE_BLOCS_CSS = `
        .mss-focusable:focus-visible {
          outline: 2px solid var(--lime);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mss-focusable { transition: none !important; }
          .mss-faq-reponse { transition: none !important; }
        }
        .mss-page h1, .mss-page h2, .mss-page h3 { text-wrap: balance; }
        .mss-page p { text-wrap: pretty; }
        .mss-atouts {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          max-width: 1180px;
          margin: 0 auto;
        }
        .mss-atout {
          padding: 28px 24px;
          border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--separator);
        }
        .mss-faq-reponse {
          display: grid;
          grid-template-rows: 0fr;
          visibility: hidden;
          transition: grid-template-rows 0.25s ease, visibility 0.25s;
        }
        .mss-faq-reponse[data-open="true"] { grid-template-rows: 1fr; visibility: visible; }
        .mss-faq-reponse > div { overflow: hidden; min-height: 0; }
        @media (max-width: 1024px) {
          .mss-atouts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .mss-atouts { grid-template-columns: minmax(0, 1fr); gap: 14px; }
        }
        .mss-splits {
          display: flex;
          flex-direction: column;
          gap: clamp(48px,7vw,88px);
        }
        .mss-split {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(32px,5vw,64px);
          align-items: center;
        }
        .mss-split:nth-child(even) > :first-child { order: 2; }
        .mss-split-photo {
          aspect-ratio: 4 / 3;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--separator);
        }
        .mss-tel {
          position: relative;
          box-sizing: border-box;
          width: min(270px, 68vw);
          margin: 0 auto;
          padding: 9px;
          border-radius: 46px;
          background: var(--bg-dark);
          border: 1px solid color-mix(in srgb, var(--text) 26%, transparent);
          box-shadow: 0 24px 80px color-mix(in srgb, var(--lime) 16%, transparent);
        }
        .mss-tel-ecran {
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          aspect-ratio: 390 / 844;
          padding-top: 11%;
          border-radius: 37px;
          background: var(--bg);
        }
        .mss-tel-ilot {
          position: absolute;
          top: 10px;
          left: 50%;
          z-index: 1;
          width: 31%;
          height: 20px;
          border-radius: 12px;
          background: #000;
          transform: translateX(-50%);
        }
        @media (max-width: 768px) {
          .mss-split { grid-template-columns: minmax(0, 1fr); gap: 20px; }
          .mss-split:nth-child(even) > :first-child { order: 0; }
        }
        .mss-galerie-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 18px;
        }
        .mss-galerie-carte { aspect-ratio: 16 / 9; grid-column: span 2; }
        .mss-galerie-carte:nth-child(n+4) { grid-column: span 3; }
        .mss-galerie-carte img { transition: transform 0.4s ease; }
        .mss-galerie-carte:hover img { transform: scale(1.04); }
        .mss-galerie-titre { font-size: 15px; line-height: 1.25; }
        @media (max-width: 640px) {
          .mss-galerie-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; }
          .mss-galerie-carte, .mss-galerie-carte:nth-child(n+4) { grid-column: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mss-galerie-carte img { transition: none; }
        }
`;

export function BlocApproche() {
  return (
    <>
      {/* ── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <section id="approche" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <Reveal style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 44px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Notre approche</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Une soirée coordonnée de A&nbsp;à&nbsp;Z, <span style={{ color: 'var(--lime)', display: 'inline-block' }}>sans stress technique</span>
            </h2>
          </div>
          <div className="mss-atouts">
            {FEATURES.map((f, i) => (
              <div key={i} className="mss-atout">
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,239,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <f.icon size={20} color="var(--lime)" />
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
    </>
  );
}

export function BlocQuiSommesNous() {
  return (
    <>
      {/* ── QUI SOMMES-NOUS ─────────────────────────────────────── */}
      {/* « Vous êtes seul ou plusieurs ? » revient dans 3 premiers appels sur 9 (Plaud, 03/11). */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: 'var(--bg-dark)', borderTop: '1px solid var(--separator)' }}>
        <Reveal style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Qui sommes-nous</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 14 }}>
            Une équipe à deux, du premier appel à la dernière danse
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8 }}>
            Derrière Myracoustic, il y a un couple. Myrio est aux platines depuis 26 ans, Virginie, son épouse,
            s&apos;occupe de la vidéo et de la technique. C&apos;est lui qui vous répond, prépare votre soirée
            avec vous et l&apos;anime le jour J. Des grands-parents aux copains, il sait faire danser tout le monde.
          </p>
        </Reveal>
      </section>
    </>
  );
}

export function BlocGalerie() {
  return (
    <>
      {/* ── GALERIE ─────────────────────────────────────────────── */}
      {/* Suite directe de « Qui sommes-nous » (même fond) : une carte par couple, demandé par Myrio le 03/11. */}
      <section style={{ padding: '0 32px clamp(56px,7vw,88px)', background: 'var(--bg-dark)' }}>
        <Reveal style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h3 style={{
            fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.2vw,22px)', fontWeight: 700,
            textAlign: 'center', marginBottom: 22,
          }}>
            Quelques mariages que nous avons fait danser
          </h3>
          <GalerieMariages />
        </Reveal>
      </section>
    </>
  );
}

/* `cta` : le bouton placé sous les services (chaque page y met le sien, avec son suivi). */
export function BlocServices({ cta }) {
  return (
    <>
      {/* ── SERVICES ────────────────────────────────────────────── */}
      <section id="services" style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Nos services</SectionLabel>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 12 }}>
              Tout ce que nous mettons en œuvre pour votre mariage
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
              Chaque mariage est différent&nbsp;: après un premier échange téléphonique, nous construisons avec vous une proposition sur mesure, adaptée à votre lieu, votre date et vos besoins.
            </p>
          </Reveal>

          <div className="mss-splits">
            {SERVICE_SPLITS.map((s) => (
              <Reveal key={s.label} className="mss-split">
                {s.photo ? (
                  <div className="mss-split-photo">
                    {/* WebP déjà compressés à la bonne taille : pas d'optimisation Next à refaire */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoSrc(s.photo.slug, s.photo.index, false)}
                      srcSet={`${photoSrc(s.photo.slug, s.photo.index, true)} 640w, ${photoSrc(s.photo.slug, s.photo.index, false)} 1366w`}
                      sizes="(max-width: 768px) 100vw, 520px"
                      alt={GALERIES.find((g) => g.slug === s.photo.slug).photos[s.photo.index]}
                      width={1366} height={768} loading="lazy" decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.photo.position, display: 'block' }}
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
                    {s.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.75 }}>
                    {insecable(s.text)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal style={{ textAlign: 'center', marginTop: 'clamp(48px,7vw,72px)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
              Photobooth, livre d&apos;or vidéo, mur LED, fumée lourde, étincelles froides&nbsp;: nous en parlons ensemble lors de notre échange.
            </p>
            {cta}
          </Reveal>
        </div>
      </section>
    </>
  );
}
