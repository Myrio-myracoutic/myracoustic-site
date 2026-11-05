'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Music, CheckCircle, Wrench, Users2, Phone, Menu, X, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import TestimonialCarousel from '../components/TestimonialCarousel';
import StatItem from '../components/StatItem';
import Reveal from '../components/Reveal';
import { gtagEvent } from '../lib/gtag';

/* Landing page dédiée — persona "premier mariage, zéro stress technique".
   Même base visuelle que /dj-mariage et /mariage. CTA unifié vers le tunnel existant
   (/devis/mariage-contact) : pas de formulaire embarqué sur cette page, volontairement. */

// Espace insécable devant la ponctuation double : jamais de « : » ou « ? » en début de ligne.
const insecable = (texte) => texte.replace(/ ([:;?!])/g, ' $1');

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

// Photos réelles fournies par Myrio (03/11) : une galerie par couple, dans public/galerie/<slug>/,
// en WebP (<slug>-01.webp en grand, <slug>-01-mini.webp pour la carte). 1re photo = couverture.
const GALERIES = [
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

const photoSrc = (slug, i, mini) =>
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
function TelephoneApp() {
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

function GalerieMariages() {
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

const LEGAL_LINKS = [
  { href: '/mentions-legales',          label: 'Mentions légales' },
  { href: '/cgv',                       label: 'Conditions générales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
];

// Ordre tiré des appels Plaud (03/11) : la piste « pour toutes les générations » est la 1re attente
// des couples ; la panne de matériel n'a été évoquée spontanément par aucun d'eux.
const FEATURES = [
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
const SERVICE_SPLITS = [
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

/* Image de fond posée seulement à l'approche du bloc (~1 écran avant), pour ne pas
   concurrencer le héro au chargement. Sans IntersectionObserver : chargée tout de suite. */
function useLazyBackground(url) {
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

const NAV_LINKS = [
  { href: '#approche', label: 'Notre approche' },
  { href: '#avis',     label: 'Avis' },
  { href: '#services', label: 'Nos services' },
  { href: '#faq',      label: 'FAQ' },
];

export default function MariageSansStressClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef(null);
  /* Vidéo du héro choisie côté client : version recadrée/compressée (~1 Mo) sur mobile, originale
     (5 Mo) sur ordinateur. Rien n'est téléchargé avant ce choix (l'image de fond s'affiche en attendant),
     ni du tout si "réduire les animations" est activé. */
  const [heroVideoSrc, setHeroVideoSrc] = useState(null);
  const [bannerPhotoRef, bannerPhotoBg] = useLazyBackground('/Ban_bretignolle.jpg');
  const [avisRef, avisBg] = useLazyBackground('/ban_mariage_sans-stress-3.jpg');
  const [parcoursRef, parcoursBg] = useLazyBackground('/ban_prestation_son.jpg');
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
    <div className="mss-page">
      {/* Image du héro mobile demandée en priorité, avant les photos plus bas dans la page */}
      <link rel="preload" as="image" href="/ban_mariage_sans-stress-mobile.webp" media="(max-width: 640px)" fetchPriority="high" />
      <style>{`
        .mss-focusable:focus-visible {
          outline: 2px solid var(--lime);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mss-focusable { transition: none !important; }
          .mss-hero-video { display: none !important; }
          .mss-faq-reponse { transition: none !important; }
        }
        .mss-page h1, .mss-page h2, .mss-page h3 { text-wrap: balance; }
        .mss-page p { text-wrap: pretty; }
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
          .mss-hero-voile {
            background: linear-gradient(to bottom,rgba(13,27,42,0.2) 0%,rgba(13,27,42,0.66) 30%,rgba(13,27,42,0.86) 100%);
          }
          .mss-stats { gap: 12px; }
          .mss-stats > div { padding: 0 !important; }
          .mss-atouts { grid-template-columns: minmax(0, 1fr); gap: 14px; }
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
          <Image src="/logo.png" alt="Myracoustic" width={140} height={47} style={{ height: 38, width: 'auto' }} priority />
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {NAV_LINKS.map((l) => (
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
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="mss-hero" style={{
        padding: 'clamp(66px,7vw,80px) 32px clamp(80px,10vw,120px)',
        backgroundImage: 'url(/ban_mariage_sans-stress.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Vidéo en fond — absente si "réduire les animations" est activé,
            l'image de fond du <section> sert alors de secours statique. */}
        {heroVideoSrc && (
          <video
            className="mss-hero-video"
            autoPlay muted loop playsInline
            poster={heroVideoSrc.endsWith('-mobile.mp4') ? '/ban_mariage_sans-stress-mobile.webp' : '/ban_mariage_sans-stress.jpg'}
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
            <SectionLabel>Mariage</SectionLabel>
            <h1 className="mss-hero-h1" style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(34px,6vw,64px)', fontWeight: 700,
              lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 20,
            }}>
              Des grands-parents aux copains, une piste pleine toute la nuit.
            </h1>
            <p className="mss-hero-subtitle" style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: 'clamp(16px,1.5vw,18px)', lineHeight: 1.75,
              marginBottom: 28, textShadow: '0 1px 14px rgba(13,27,42,0.7)',
            }}>
              DJ, son, lumière et le film de votre soirée&nbsp;: tout compris, un seul contact, un devis clair.
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
            <div className="hide-mobile" style={{ marginTop: 28 }}>
              <CtaButton location="services" />
            </div>
          </Reveal>
        </div>
      </section>

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
            Votre sérénité, notre priorité
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8 }}>
            Votre mariage ne se rejoue pas. Nous prévoyons tout en amont : matériel professionnel, systèmes de secours et équipe dédiée. Si un imprévu de notre fait venait perturber votre soirée, nous nous engageons à intervenir rapidement, selon les conditions prévues dans nos CGV.
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
            {FAQ.map((item, i) => <FaqItem key={i} {...item} />)}
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
  );
}
