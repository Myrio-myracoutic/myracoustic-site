'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatedWave } from '../../components/AnimatedWave';

/* ════════════════════════════════════════════════════════════════════
   TARIFS — source : docs/grilles-tarifaires.md
══════════════════════════════════════════════════════════════════════ */

const TODAY = new Date(2026, 5, 6);

/* Dates disponibles — à mettre à jour selon le planning réel */
const AVAIL = new Set([
  // Juin 2026
  '2026-06-07','2026-06-13','2026-06-20','2026-06-27',
  // Juillet 2026
  '2026-07-05','2026-07-11','2026-07-18','2026-07-25',
  // Août 2026
  '2026-08-01','2026-08-08','2026-08-15','2026-08-22','2026-08-29',
  // Septembre 2026
  '2026-09-05','2026-09-12','2026-09-19','2026-09-26',
  // Octobre 2026
  '2026-10-03','2026-10-10','2026-10-17','2026-10-24','2026-10-31',
  // Novembre 2026
  '2026-11-07','2026-11-14','2026-11-21','2026-11-28',
  // Décembre 2026
  '2026-12-05','2026-12-12','2026-12-19',
]);

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

/* Son — forfait auto selon nombre de personnes */
function getSonForfait(nb) {
  const n = parseInt(nb) || 0;
  if (n <= 0)   return null;
  if (n < 50)   return { label: 'Jusqu\'à 50 personnes', price: 80 };
  if (n <= 100) return { label: '50 – 100 personnes',    price: 100 };
  if (n <= 200) return { label: '100 – 200 personnes',   price: 150 };
  if (n <= 500) return { label: '200 – 500 personnes',   price: 250 };
  return null; /* sur devis */
}

const ECLAIR_BASE_PRICE = 100; /* toujours inclus */
const ECLAIR_OPTS = [
  { id: 'archi',      label: 'Projecteurs architecturaux',         price: 50,  mariageOnly: false },
  { id: 'etincelles', label: 'Machines à étincelles froides (×2)', price: 100, mariageOnly: false },
  { id: 'fumee',      label: 'Machine à fumée lourde',             price: 50,  mariageOnly: true  },
];

const VIDEO_OPTS = [
  { id: 'none',       label: 'Sans vidéo',      price: 0   },
  { id: 'projecteur', label: 'Vidéoprojecteur',  price: 50  },
  { id: 'led2',       label: 'Mur LED 2 m²',     price: 300 },
  { id: 'led4',       label: 'Mur LED 4 m²',     price: 600 },
];

const DJ_CFG = {
  Mariage: { minDur: 6, forfait: 750, xph: 55 },
  _other:  { minDur: 4, forfait: 400, xph: 40 },
};
const getDJCfg = (type) => DJ_CFG[type] ?? DJ_CFG['_other'];

const INSTALL_PRICE  = 50;
const TECH_PRICE     = 100;
const KARAOKE_PRICE  = 100;

/* Transport : forfait par tranche de distance */
function getTransportFee(km) {
  if (!km)      return 0;
  if (km <= 100) return 40;
  if (km <= 200) return 60;
  if (km <= 400) return 80;
  if (km <= 600) return 100;
  return null; /* sur devis */
}

/* Remise anticipation : 15 % si signé rapidement */
function getRemise(dateStr) {
  if (!dateStr) return null;
  const diff = Math.round((new Date(dateStr + 'T12:00:00') - TODAY) / 86400000);
  if (diff < 90)  return '3 jours';
  if (diff < 180) return '1 semaine';
  return '2 semaines';
}

/* Estimation km sans API (hash déterministe) */
function hashKm(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffff;
  return 14 + (h % 154);
}

/* ════════════════════════════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
══════════════════════════════════════════════════════════════════════ */

function AnimatedPrice({ value }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const from = prev.current, to = value, dur = 380, t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setDisp(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return <span>{disp.toLocaleString('fr-FR')}</span>;
}

function MiniCal({ selected, onSelect }) {
  const [month, setMonth] = useState(5);
  const yr   = 2026;
  const dim  = new Date(yr, month + 1, 0).getDate();
  const fd   = (new Date(yr, month, 1).getDay() + 6) % 7;
  const days = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const mk   = (d) => `${yr}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const past = (d) => new Date(yr, month, d) < TODAY;

  return (
    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setMonth(m => Math.max(5, m - 1))}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, padding: '2px 8px' }}>‹</button>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 13 }}>
          {MONTHS_FR[month]} {yr}
        </span>
        <button onClick={() => setMonth(m => Math.min(11, m + 1))}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, padding: '2px 8px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3 }}>
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = mk(d), avail = AVAIL.has(k), pt = past(d), sel = selected === k;
          return (
            <button key={i} onClick={() => avail && !pt && onSelect(k)} disabled={!avail || pt}
              style={{
                background: sel ? 'var(--lime)' : avail && !pt ? 'rgba(184,239,11,0.07)' : 'transparent',
                color: sel ? '#0d1b2a' : (!avail || pt) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.82)',
                border: `1px solid ${sel ? 'var(--lime)' : avail && !pt ? 'rgba(184,239,11,0.25)' : 'transparent'}`,
                borderRadius: 5, padding: '5px 0', fontSize: 12,
                cursor: !avail || pt ? 'default' : 'pointer',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: sel ? 700 : 400,
              }}>
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', marginRight: 4 }} />
          Disponible
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />
          Indisponible
        </span>
      </div>
    </div>
  );
}

function ProfileCard({ icon, title, sub, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(184,239,11,0.08)' : 'var(--card)',
        border: `1px solid ${hov ? 'var(--lime)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 14, padding: '32px 24px', cursor: 'pointer',
        transition: 'all 0.25s', transform: hov ? 'translateY(-4px)' : 'none',
        textAlign: 'center', width: '100%',
      }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 22,
        marginBottom: 8, color: hov ? 'var(--lime)' : 'white',
      }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{sub}</div>
      {badge && (
        <div style={{
          marginTop: 14, display: 'inline-block', padding: '4px 12px',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20,
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em',
        }}>{badge}</div>
      )}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STYLES RÉUTILISABLES
══════════════════════════════════════════════════════════════════════ */

const IS = {
  width: '100%', padding: '12px 15px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-body), sans-serif', transition: 'border-color 0.2s',
};
const fo = (e) => { e.target.style.borderColor = 'var(--lime)'; };
const bl = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

const BtnPrimary = ({ children, onClick, disabled, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: disabled ? 'rgba(255,255,255,0.07)' : 'var(--lime)',
      color: disabled ? 'rgba(255,255,255,0.22)' : '#0d1b2a',
      border: 'none', cursor: disabled ? 'default' : 'pointer',
      padding: '14px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700,
      fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.2s',
      ...style,
    }}
    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = '#ceff2a'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
    onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
    {children}
  </button>
);

/* ════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════════════════ */

export default function DevisPage() {
  /* ── Navigation tunnel ─────────────────────────────────────────── */
  const [profil, setProfil] = useState('');
  const [step,   setStep]   = useState(-1);
  const [sent,   setSent]   = useState(false);

  /* ── Particulier — identité & événement ────────────────────────── */
  const [email,      setEmail]      = useState('');
  const [emailErr,   setEmailErr]   = useState('');
  const [prenom,     setPrenom]     = useState('');
  const [nom,        setNom]        = useState('');
  const [tel,        setTel]        = useState('');
  const [eventType,  setEventType]  = useState('Mariage');
  const [date,       setDate]       = useState('');
  const [lieu,       setLieu]       = useState('');
  const [km,         setKm]         = useState(null);
  const [kmLoading,  setKmLoading]  = useState(false);

  /* ── Particulier — prestations ──────────────────────────────────── */
  const [nbPersons,     setNbPersons]     = useState('');
  const [eclairOpts,    setEclairOpts]    = useState({ archi: false, etincelles: false, fumee: false });
  const [videoChoice,   setVideoChoice]   = useState('none');
  const [djDuration,    setDjDuration]    = useState(6);
  const [karaokeActive, setKaraokeActive] = useState(false);

  /* ── Particulier — facturation ─────────────────────────────────── */
  const [adresse, setAdresse] = useState('');
  const [cp,      setCp]      = useState('');
  const [ville,   setVille]   = useState('');

  /* ── Professionnel ─────────────────────────────────────────────── */
  const [proPrenom,   setProPrenom]   = useState('');
  const [proNom,      setProNom]      = useState('');
  const [proSociete,  setProSociete]  = useState('');
  const [proEmail,    setProEmail]    = useState('');
  const [proTel,      setProTel]      = useState('');
  const [proPoste,    setProPoste]    = useState('');
  const [proType,     setProType]     = useState('');
  const [proPersonnes,setProPersonnes]= useState('');
  const [proDate,     setProDate]     = useState('');
  const [proBudget,   setProBudget]   = useState('');
  const [proLieu,     setProLieu]     = useState('');
  const [proDesc,     setProDesc]     = useState('');

  /* ── Totaux calculés ───────────────────────────────────────────── */
  const djCfg = getDJCfg(eventType);
  useEffect(() => { setDjDuration(d => Math.max(djCfg.minDur, d)); }, [eventType]);

  const son       = getSonForfait(nbPersons);
  const sonPrice  = son?.price ?? 0;
  const eclairOptTotal = ECLAIR_OPTS.reduce((acc, o) => {
    if (!eclairOpts[o.id]) return acc;
    if (o.mariageOnly && eventType !== 'Mariage') return acc;
    return acc + o.price;
  }, 0);
  const videoPrice    = VIDEO_OPTS.find(v => v.id === videoChoice)?.price ?? 0;
  const djForFait     = djCfg.forfait;
  const djXtraHours   = Math.max(0, djDuration - djCfg.minDur);
  const djXtraCost    = djXtraHours * djCfg.xph;
  const nb            = parseInt(nbPersons) || 0;
  const techPrice     = nb > 100 ? TECH_PRICE : 0;
  const kmFee         = getTransportFee(km) ?? 0;
  const totalBrut     =
    sonPrice + ECLAIR_BASE_PRICE + eclairOptTotal +
    videoPrice + djForFait + djXtraCost +
    (karaokeActive ? KARAOKE_PRICE : 0) + INSTALL_PRICE + techPrice + kmFee;
  const remiseDelai   = getRemise(date);
  const totalNet      = remiseDelai ? Math.round(totalBrut * 0.85) : totalBrut;
  const acompte60     = Math.round(totalBrut * 0.6);
  const solde40       = totalBrut - acompte60;

  /* ── Actions ────────────────────────────────────────────────────── */
  const goBack = () => {
    if (step === -1) return;
    if (step === 0 || step === 10) { setStep(-1); setProfil(''); return; }
    setStep(s => s - 1);
  };

  const validateEmail = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Adresse invalide.'); return; }
    setEmailErr(''); setStep(1);
  };

  const estimateKm = () => {
    if (!lieu.trim()) return;
    setKmLoading(true);
    setTimeout(() => { setKm(hashKm(lieu.trim())); setKmLoading(false); }, 1200);
  };

  /* ── Progress bar ───────────────────────────────────────────────── */
  const isPart = profil === 'particulier' && step >= 0 && step <= 4;
  const isPro  = profil === 'professionnel' && step >= 10;

  const Header = () => (
    <div style={{
      background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 28px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 80,
    }}>
      <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
      }}>← Retour</button>

      <img src="/logo.png" alt="Myracoustic" style={{ height: 40 }} />

      {(isPart || isPro) ? (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {Array.from({ length: isPro ? 2 : 5 }).map((_, i) => {
            const done = isPro ? (step - 9) > i : (step) > i;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: done ? 'var(--lime)' : 'rgba(255,255,255,0.07)',
                  color: done ? '#0d1b2a' : 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 11,
                  transition: 'all 0.3s',
                }}>{i + 1}</div>
                {i < (isPro ? 1 : 4) && (
                  <div style={{ width: 14, height: 1, background: done ? 'var(--lime)' : 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            );
          })}
        </div>
      ) : <div style={{ width: 80 }} />}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     ÉTAPES PARTICULIER
  ══════════════════════════════════════════════════════════════════ */

  /* Gate — choix du profil */
  const renderGate = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        <AnimatedWave bars={36} height={60} style={{ marginBottom: 28, display: 'block', margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, marginBottom: 8 }}>
          Demande de devis
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, marginBottom: 36, lineHeight: 1.7 }}>
          Choisissez votre profil pour accéder au parcours adapté.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ProfileCard icon="🎉" title="Particulier"
            sub={"Mariage, anniversaire\nsoirée privée"} badge="Devis en ligne immédiat"
            onClick={() => { setProfil('particulier'); setStep(0); }} />
          <ProfileCard icon="🏢" title="Professionnel"
            sub={"Séminaire, gala\nsoirée d'entreprise"} badge="Prise de contact"
            onClick={() => { setProfil('professionnel'); setStep(10); }} />
        </div>
      </div>
    </div>
  );

  /* Étape 0 — Email */
  const renderStep0 = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <AnimatedWave bars={28} height={48} style={{ display: 'block', margin: '0 auto 24px' }} />
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, marginBottom: 8 }}>
          Votre adresse e-mail
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24, lineHeight: 1.65 }}>
          Nous l'utiliserons pour vous envoyer votre devis.
        </p>
        <input type="email" placeholder="votre@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
          onFocus={fo} onBlur={bl}
          onKeyDown={e => e.key === 'Enter' && validateEmail()}
          style={{ ...IS, textAlign: 'center', fontSize: 16, marginBottom: emailErr ? 6 : 20 }} />
        {emailErr && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'left' }}>{emailErr}</p>}
        <BtnPrimary onClick={validateEmail} style={{ width: '100%' }}>
          Valider mon adresse →
        </BtnPrimary>
      </div>
    </div>
  );

  /* Étape 1 — Infos + lieu */
  const renderStep1 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos informations
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Étape 1 sur 5 · Infos personnelles & événement</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Identité */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            👤 Identité
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Prénom *" value={prenom} onChange={e => setPrenom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            <input placeholder="Nom *" value={nom} onChange={e => setNom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Téléphone *" value={tel} onChange={e => setTel(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            <input value={email} readOnly style={{ ...IS, color: 'rgba(255,255,255,0.4)', cursor: 'default' }} />
          </div>
        </div>

        {/* Événement */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            📅 Votre événement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Type d'événement</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Mariage', 'PACS', 'Anniversaire', 'Soirée privée', 'EVJF / EVG', 'Bat / Bar-Mitzvah', 'Communion', 'Fête familiale', 'Autre'].map(t => (
                  <button key={t} onClick={() => setEventType(t)} style={{
                    padding: '8px 16px', borderRadius: 7,
                    border: `1px solid ${eventType === t ? 'var(--lime)' : 'rgba(255,255,255,0.12)'}`,
                    background: eventType === t ? 'rgba(184,239,11,0.1)' : 'transparent',
                    color: eventType === t ? 'var(--lime)' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-display), sans-serif', fontWeight: eventType === t ? 700 : 500, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Date de l'événement</div>
              <MiniCal selected={date} onSelect={setDate} />
              {date && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif' }}>
                  ✓ {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lieu */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            📍 Lieu de l'événement
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: km ? 12 : 0 }}>
            <input placeholder="Adresse complète de la salle / lieu"
              value={lieu} onChange={e => setLieu(e.target.value)}
              onFocus={fo} onBlur={bl} style={{ ...IS, flex: '1 1 240px' }}
              onKeyDown={e => e.key === 'Enter' && estimateKm()} />
            <button onClick={estimateKm} disabled={!lieu.trim() || kmLoading}
              style={{
                padding: '12px 18px', borderRadius: 8, border: 'none',
                cursor: lieu.trim() && !kmLoading ? 'pointer' : 'default',
                background: lieu.trim() ? 'var(--lime)' : 'rgba(255,255,255,0.06)',
                color: lieu.trim() ? '#0d1b2a' : 'rgba(255,255,255,0.22)',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              }}>
              {kmLoading ? '⌛ Calcul…' : '📍 Estimer le trajet'}
            </button>
          </div>
          {km && (
            <div style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '12px 14px', background: 'rgba(184,239,11,0.06)',
              border: '1px solid rgba(184,239,11,0.18)', borderRadius: 8, fontSize: 13,
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', marginBottom: 2 }}>Distance estimée</span>
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)' }}>{km} km</span>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', marginBottom: 2 }}>Forfait déplacement</span>
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)' }}>{kmFee} €</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, alignSelf: 'flex-end', paddingBottom: 1 }}>
                Aller-retour depuis Nort-sur-Erdre
              </div>
            </div>
          )}
        </div>

        <BtnPrimary onClick={() => setStep(2)} disabled={!prenom || !nom || !tel || !date}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  /* Étape 2 — Prestations */
  const renderStep2 = () => (
    <div style={{ flex: 1, padding: '28px 24px 130px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos prestations
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Étape 2 sur 5 · Configurez votre événement</p>

      {/* Nombre de personnes */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          👥 Nombre de personnes
        </span>
        <input type="number" min={1} max={2000} placeholder="Ex : 120"
          value={nbPersons} onChange={e => setNbPersons(e.target.value)}
          style={{ ...IS, width: 110, textAlign: 'center', fontSize: 17, fontWeight: 700 }}
          onFocus={fo} onBlur={bl} />
        {nb > 0 && (
          <div style={{ fontSize: 12, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>
            ✓ {nb.toLocaleString('fr-FR')} personnes
          </div>
        )}
      </div>

      {/* Son */}
      <PackBlock title="🔊 Sonorisation" badge="OBLIGATOIRE" badgeColor="#f87171">
        {nb > 0 ? (
          son ? (
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                  ✓ {son.label} — forfait automatique
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  Système adapté à votre configuration · technicien inclus
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--lime)' }}>
                {son.price} €
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 18px', color: '#f97316', fontSize: 13 }}>
              Plus de 500 personnes · tarif sur devis — contactez-nous directement.
            </div>
          )
        ) : (
          <div style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            ↑ Indiquez le nombre de personnes pour voir votre forfait son.
          </div>
        )}
      </PackBlock>

      {/* Éclairage */}
      <PackBlock title="💡 Éclairage" badge="OBLIGATOIRE" badgeColor="#f87171">
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
              Ambiance piste de danse — machine à fumée incluse
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Inclus obligatoirement dans chaque prestation</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
            {ECLAIR_BASE_PRICE} €
          </div>
        </div>
        {ECLAIR_OPTS.filter(o => !o.mariageOnly || eventType === 'Mariage').map(o => (
          <ToggleRow key={o.id} label={o.label} price={o.price}
            checked={eclairOpts[o.id]}
            onChange={() => setEclairOpts(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
            note={o.mariageOnly ? 'Mariages uniquement' : ''}
          />
        ))}
      </PackBlock>

      {/* Vidéo */}
      <PackBlock title="🎬 Vidéo & Écrans" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        {VIDEO_OPTS.map(o => (
          <RadioRow key={o.id} label={o.label} price={o.price}
            selected={videoChoice === o.id}
            onSelect={() => setVideoChoice(o.id)}
          />
        ))}
      </PackBlock>

      {/* DJ */}
      <PackBlock title="🎧 Animation DJ" badge="OBLIGATOIRE" badgeColor="#f87171">
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
              ✓ DJ professionnel inclus dans chaque prestation
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Choisissez la durée selon votre événement — minimum {djCfg.minDur}h
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
            {djCfg.forfait} €
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: 'rgba(184,239,11,0.04)' }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
            ⏱ Durée — minimum <span style={{ color: 'var(--lime)' }}>{djCfg.minDur}h</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setDjDuration(d => Math.max(djCfg.minDur, d - 1))}
                style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>−</button>
              <div style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--lime)' }}>{djDuration}h</div>
              <button onClick={() => setDjDuration(d => d + 1)}
                style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>+</button>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Forfait : </span>
              <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{djCfg.forfait} €</span>
              {djXtraHours > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {' '}+ {djXtraHours}h supp. · <span style={{ color: 'var(--lime)', fontWeight: 700 }}>+{djXtraCost} €</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </PackBlock>

      {/* Karaoké */}
      <PackBlock title="🎤 Karaoké" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        <ToggleRow label="Ajouter un système karaoké" price={KARAOKE_PRICE}
          checked={karaokeActive}
          onChange={() => setKaraokeActive(v => !v)}
        />
      </PackBlock>

      {/* Barre totale fixe */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(184,239,11,0.25)', padding: '13px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            Total estimé TTC {kmFee > 0 && `· dont ${kmFee} € déplacement`}
          </div>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 'clamp(18px,3vw,28px)', color: 'var(--lime)' }}>
            <AnimatedPrice value={totalBrut} /> €
          </div>
        </div>
        <BtnPrimary onClick={() => setStep(3)}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  /* Étape 3 — Facturation */
  const renderStep3 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Adresse de facturation
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Étape 3 sur 5 · Coordonnées de facturation</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Numéro et rue *" value={adresse} onChange={e => setAdresse(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
          <input placeholder="Code postal *" value={cp} onChange={e => setCp(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          <input placeholder="Ville *" value={ville} onChange={e => setVille(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        </div>
        <BtnPrimary onClick={() => setStep(4)} disabled={!adresse || !cp || !ville} style={{ marginTop: 8 }}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  /* Étape 4 — Récapitulatif */
  const renderStep4 = () => {
    if (sent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <AnimatedWave bars={32} height={56} style={{ marginBottom: 24 }} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 700, marginBottom: 10 }}>
            Votre devis a été envoyé !
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
            Votre devis a été envoyé immédiatement à <strong style={{ color: 'white' }}>{email}</strong>.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
            Vérifiez votre boîte e-mail — le devis est signable en ligne.
          </p>
          {remiseDelai && (
            <div style={{ background: 'rgba(184,239,11,0.07)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)', marginBottom: 4 }}>
                ⏰ Remise 15 % — signez sous {remiseDelai}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
                Total remisé : <strong style={{ color: 'var(--lime)' }}>{totalNet.toLocaleString('fr-FR')} € TTC</strong> au lieu de {totalBrut.toLocaleString('fr-FR')} €.
              </div>
            </div>
          )}
          <Link href="/" style={{
            background: 'var(--lime)', color: '#0d1b2a', border: 'none', cursor: 'pointer',
            padding: '13px 30px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', display: 'inline-block',
          }}>Retour à l'accueil</Link>
        </div>
      </div>
    );

    /* Lignes récap */
    const lines = [
      ['Client',      `${prenom} ${nom}`],
      ['Email',       email],
      ['Téléphone',   tel],
      ['Événement',   `${eventType} · ${date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`],
      ['Lieu',        lieu || '-'],
      nb > 0 && ['Invités', `${nb.toLocaleString('fr-FR')} personnes`],
      km && ['Déplacement', `${km} km · forfait ${kmFee} €`],
      ['Facturation', `${adresse}, ${cp} ${ville}`],
    ].filter(Boolean);

    const prestLines = [
      son && [`Son (${son.label})`, son.price],
      ['Éclairage ambiance', ECLAIR_BASE_PRICE],
      ...ECLAIR_OPTS.filter(o => eclairOpts[o.id] && (!o.mariageOnly || eventType === 'Mariage')).map(o => [o.label, o.price]),
      videoChoice !== 'none' && [VIDEO_OPTS.find(v => v.id === videoChoice)?.label, videoPrice],
      [`DJ (${djDuration}h)`, djForFait + djXtraCost],
      karaokeActive && ['Karaoké', KARAOKE_PRICE],
      ['Installation / désinstallation', INSTALL_PRICE],
      nb > 100 && ['Technicien journée', TECH_PRICE],
      kmFee > 0 && ['Forfait déplacement', kmFee],
    ].filter(Boolean);

    return (
      <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
          Récapitulatif
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Étape 4 sur 5 · Vérifiez et envoyez</p>

        {/* Remise */}
        {remiseDelai && (
          <div style={{ background: 'rgba(184,239,11,0.07)', border: '1px solid rgba(184,239,11,0.22)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--lime)' }}>
                ⏰ Remise 15 % si vous signez sous {remiseDelai}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--lime)' }}>
                {totalNet.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
              Au lieu de {totalBrut.toLocaleString('fr-FR')} € · économie de {(totalBrut - totalNet).toLocaleString('fr-FR')} €
            </div>
          </div>
        )}

        {/* Infos client */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          {lines.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>{k}</span>
              <span style={{ color: 'rgba(255,255,255,0.82)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Prestations */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          {prestLines.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{k}</span>
              <span style={{ color: 'rgba(255,255,255,0.82)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>{Number(v).toLocaleString('fr-FR')} €</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', fontSize: 17 }}>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>TOTAL TTC</span>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)', fontSize: 22 }}>{totalBrut.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        {/* Conditions paiement 60/40 */}
        {totalBrut > 0 && (
          <div style={{ background: 'rgba(52,55,144,0.12)', border: '1px solid rgba(52,55,144,0.35)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
              💳 Conditions de paiement
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid var(--lime)' }}>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Acompte à la signature</div>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 26, color: 'white', lineHeight: 1 }}>{acompte60.toLocaleString('fr-FR')} €</div>
                <div style={{ color: 'var(--lime)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>60 %</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid rgba(52,55,144,0.8)' }}>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Solde le jour J</div>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 26, color: 'white', lineHeight: 1 }}>{solde40.toLocaleString('fr-FR')} €</div>
                <div style={{ color: 'rgba(184,239,11,0.6)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>40 %</div>
              </div>
            </div>
          </div>
        )}

        <BtnPrimary onClick={() => setSent(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          ✉️ Envoyer mon devis pour signature
        </BtnPrimary>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 10 }}>
          Envoyé immédiatement par e-mail · Signature électronique sécurisée
        </p>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     ÉTAPES PROFESSIONNEL
  ══════════════════════════════════════════════════════════════════ */

  const renderStep10 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos coordonnées
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Étape 1 sur 2 · Informations de contact</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Prénom *" value={proPrenom} onChange={e => setProPrenom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          <input placeholder="Nom *" value={proNom} onChange={e => setProNom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        </div>
        <input placeholder="Société / Raison sociale *" value={proSociete} onChange={e => setProSociete(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Email professionnel *" value={proEmail} onChange={e => setProEmail(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          <input placeholder="Téléphone *" value={proTel} onChange={e => setProTel(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        </div>
        <input placeholder="Poste / Fonction" value={proPoste} onChange={e => setProPoste(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        <BtnPrimary onClick={() => setStep(11)} disabled={!proPrenom || !proNom || !proSociete || !proEmail || !proTel} style={{ marginTop: 8 }}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  const renderStep11 = () => {
    if (sent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <AnimatedWave bars={32} height={56} style={{ marginBottom: 24 }} />
          <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, marginBottom: 10 }}>
            Demande reçue !
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            Notre équipe vous contactera sous 24h à <strong style={{ color: 'white' }}>{proEmail}</strong> pour planifier votre rendez-vous.
          </p>
          <Link href="/" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', display: 'inline-block',
          }}>Retour à l'accueil</Link>
        </div>
      </div>
    );

    return (
      <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
          Votre événement
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Étape 2 sur 2 · Détails de la prestation souhaitée</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select value={proType} onChange={e => setProType(e.target.value)}
              style={{ ...IS, cursor: 'pointer', color: proType ? 'white' : 'rgba(255,255,255,0.35)', appearance: 'none' }}
              onFocus={fo} onBlur={bl}>
              <option value="" disabled>Type d'événement *</option>
              {["Séminaire", "Gala / Soirée de prestige", "Lancement produit", "Soirée d'entreprise", "Conférence", "Autre"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input placeholder="Effectif estimé *" value={proPersonnes} onChange={e => setProPersonnes(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Date souhaitée" value={proDate} onChange={e => setProDate(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            <select value={proBudget} onChange={e => setProBudget(e.target.value)}
              style={{ ...IS, cursor: 'pointer', color: proBudget ? 'white' : 'rgba(255,255,255,0.35)', appearance: 'none' }}
              onFocus={fo} onBlur={bl}>
              <option value="" disabled>Budget indicatif</option>
              {['< 3 000 €', '3 000 – 6 000 €', '6 000 – 12 000 €', '12 000 – 25 000 €', '> 25 000 €'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <input placeholder="Lieu prévu (ville, salle, adresse)" value={proLieu} onChange={e => setProLieu(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          <textarea placeholder="Décrivez votre projet et vos besoins…"
            value={proDesc} onChange={e => setProDesc(e.target.value)} rows={4}
            style={{ ...IS, resize: 'vertical', lineHeight: 1.65 }}
            onFocus={fo} onBlur={bl} />
          <BtnPrimary onClick={() => setSent(true)} disabled={!proType || !proPersonnes} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            📨 Envoyer ma demande de contact →
          </BtnPrimary>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>
            Notre équipe vous recontacte sous 24h ouvrées
          </p>
        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Header />
      {step === -1                           && renderGate()}
      {profil === 'particulier' && step === 0 && renderStep0()}
      {profil === 'particulier' && step === 1 && renderStep1()}
      {profil === 'particulier' && step === 2 && renderStep2()}
      {profil === 'particulier' && step === 3 && renderStep3()}
      {profil === 'particulier' && step === 4 && renderStep4()}
      {profil === 'professionnel' && step === 10 && renderStep10()}
      {profil === 'professionnel' && step === 11 && renderStep11()}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS STEP 2
══════════════════════════════════════════════════════════════════════ */

function PackBlock({ title, badge, badgeColor, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: `${badgeColor}22`, color: badgeColor, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em' }}>
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, price, checked, onChange, note }) {
  return (
    <div onClick={onChange}
      style={{
        padding: '14px 18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        background: checked ? 'rgba(184,239,11,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.18s',
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${checked ? 'var(--lime)' : 'rgba(255,255,255,0.2)'}`,
        background: checked ? 'var(--lime)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d1b2a' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: checked ? 'var(--lime)' : 'white' }}>{label}</span>
        {note && <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{note}</span>}
      </div>
      {price != null && (
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: checked ? 'var(--lime)' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
          {price} €
        </div>
      )}
    </div>
  );
}

function RadioRow({ label, price, selected, onSelect }) {
  return (
    <div onClick={onSelect}
      style={{
        padding: '14px 18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        background: selected ? 'rgba(184,239,11,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.18s',
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--lime)' : 'rgba(255,255,255,0.2)'}`,
        background: selected ? 'var(--lime)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d1b2a' }} />}
      </div>
      <div style={{ flex: 1, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: selected ? 'var(--lime)' : 'white' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: selected ? 'var(--lime)' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
        {price > 0 ? `${price} €` : price === 0 ? 'Gratuit' : ''}
      </div>
    </div>
  );
}
