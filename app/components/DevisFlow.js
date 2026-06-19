'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedWave } from './AnimatedWave';
import { gtagEvent, gtagBeacon } from '../lib/gtag';

/* ════════════════════════════════════════════════════════════════════
   TARIFS — source : docs/grilles-tarifaires.md
══════════════════════════════════════════════════════════════════════ */

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

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
  { id: 'archi',      label: 'Mise en lumière de la salle',         price: 50,  mariageOnly: false },
  { id: 'etincelles', label: 'Machines à étincelles froides (×2)', price: 100, mariageOnly: false },
  { id: 'fumee',      label: 'Machine à fumée lourde',             price: 50,  mariageOnly: true  },
];

const VIDEO_OPTS = [
  { id: 'none',       label: 'Sans vidéo',      price: 0   },
  { id: 'projecteur', label: 'Vidéoprojecteur',  price: 50  },
  { id: 'led2',       label: 'Mur LED 2 m²',     price: 300 },
  { id: 'led4',       label: 'Mur LED 4 m²',     price: 600 },
];

const CIBLE_VIDEO_OPTS = [{ id: 'fourni', label: 'L\'entreprise met un écran à disposition de Myracoustic', price: 0 }, ...VIDEO_OPTS];

const DJ_CFG = {
  Mariage: { minDur: 6, forfait: 600, xph: 55 },
  _other:  { minDur: 4, forfait: 4 * 85, xph: 85 },
};
const getDJCfg = (type) => DJ_CFG[type] ?? DJ_CFG['_other'];

/* DJ — tarif spécifique « prestation ciblée » pro : forfait 4h min à 125 €/h, heures supp. à 60 €/h, le tout HT */
const DJ_PRO_CFG = { minDur: 4, tarifHoraire: 125, forfait: 4 * 125, xph: 60 };

/* Éclairage — option conservée pour la prestation ciblée pro (fumée lourde et étincelles froides exclues) */
const ECLAIR_ARCHI_PRICE = ECLAIR_OPTS.find(o => o.id === 'archi')?.price ?? 50;

const INSTALL_PRICE  = 50;
const TECH_PRICE     = 100;
const KARAOKE_PRICE  = 100;
const MICRO_PRICE    = 25; /* HT par micro supplémentaire — prestation ciblée pro */

/* Transport : forfait par tranche de distance */
function getTransportFee(km) {
  if (!km)      return 0;
  if (km <= 100) return 40;
  if (km <= 200) return 60;
  if (km <= 400) return 80;
  if (km <= 600) return 100;
  return null; /* sur devis */
}

/* Formate une date locale en YYYY-MM-DD sans décalage UTC
   (toISOString() décale d'un jour en France, UTC+1/+2) */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* Remise anticipation : 15 % si signature avant une échéance calculée depuis la date d'établissement du devis (aujourd'hui) */
function getRemiseDeadline(dateStr) {
  if (!dateStr) return null;
  const diff = Math.round((new Date(dateStr + 'T12:00:00') - TODAY) / 86400000);
  const delayDays = diff < 90 ? 3 : diff < 180 ? 7 : 14;
  const deadline = new Date(TODAY);
  deadline.setDate(deadline.getDate() + delayDays);
  return deadline;
}

/* Calcul de distance réelle (Mapbox) — point de départ : Nort-sur-Erdre */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ORIGIN_COORDS = [-1.4972, 47.4453]; /* Nort-sur-Erdre */

async function geocodeAddress(query) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=fr&autocomplete=true&types=address,place&limit=5&language=fr`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || []).map(f => ({
    label: f.place_name,
    coords: f.center,
    street: f.address ? `${f.address} ${f.text}` : f.text,
    postcode: f.context?.find(c => c.id.startsWith('postcode'))?.text || '',
    city: f.context?.find(c => c.id.startsWith('place'))?.text || '',
  }));
}

/* Distance routière aller-retour (km), arrondie */
async function getRoadKm([lng, lat]) {
  const res = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${ORIGIN_COORDS[0]},${ORIGIN_COORDS[1]};${lng},${lat}` +
    `?access_token=${MAPBOX_TOKEN}&overview=false`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const meters = data.routes?.[0]?.distance;
  if (!meters) return null;
  return Math.round((meters / 1000) * 2);
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

function MiniCal({ selected, onSelect, devisPending = {}, bookedDates = new Set(), yearsAhead = 1, loading = false }) {
  const startYr = TODAY.getFullYear();
  const YEARS   = Array.from({ length: yearsAhead + 1 }, (_, i) => startYr + i);
  const [year,  setYear]  = useState(startYr);
  const [month, setMonth] = useState(TODAY.getMonth());

  const dim  = new Date(year, month + 1, 0).getDate();
  const fd   = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const mk   = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const past = (d) => new Date(year, month, d) < TODAY;
  const horizon = new Date(TODAY.getFullYear() + yearsAhead, TODAY.getMonth(), TODAY.getDate());
  const withinYear = (d) => new Date(year, month, d) <= horizon;

  const canPrev = year > startYr || (year === startYr && month > TODAY.getMonth());
  const canNext = year < YEARS[YEARS.length - 1] || month < 11;

  const prevMonth = () => {
    if (!canPrev) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canNext) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectYear = (y) => {
    setYear(y);
    if (y === startYr && month < TODAY.getMonth()) setMonth(TODAY.getMonth());
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10, zIndex: 10,
          background: 'rgba(6,14,22,0.75)', backdropFilter: 'blur(2px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <style>{`@keyframes mra-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: 26, height: 26,
            border: '2px solid rgba(255,255,255,0.12)',
            borderTop: '2px solid var(--lime)',
            borderRadius: '50%',
            animation: 'mra-spin 0.75s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-display), sans-serif' }}>
            Chargement des disponibilités…
          </span>
        </div>
      )}
      {/* Sélecteur d'année */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, justifyContent: 'center' }}>
        {YEARS.map(y => (
          <button key={y} onClick={() => selectYear(y)}
            style={{
              background: year === y ? 'var(--lime)' : 'rgba(255,255,255,0.05)',
              color: year === y ? '#0d1b2a' : 'rgba(255,255,255,0.45)',
              border: `1px solid ${year === y ? 'var(--lime)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20, padding: '3px 12px', fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font-display), sans-serif', fontWeight: year === y ? 700 : 400,
              transition: 'all 0.2s',
            }}>
            {y}
          </button>
        ))}
      </div>
      {/* Navigation mois */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} disabled={!canPrev}
          style={{ background: 'none', border: 'none', color: canPrev ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', cursor: canPrev ? 'pointer' : 'default', fontSize: 18, padding: '2px 8px' }}>‹</button>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 13 }}>
          {MONTHS_FR[month]} {year}
        </span>
        <button onClick={nextMonth} disabled={!canNext}
          style={{ background: 'none', border: 'none', color: canNext ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', cursor: canNext ? 'pointer' : 'default', fontSize: 18, padding: '2px 8px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3 }}>
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = mk(d), avail = withinYear(d), pt = past(d), sel = selected === k;
          const booked = bookedDates.has(k);
          const pCount = avail && !pt && !booked ? (devisPending[k] ?? 0) : 0;
          const trueBlocked = !avail || pt;  /* passé ou hors plage — vraiment non cliquable */
          const blocked = trueBlocked || booked;  /* pour le style */
          return (
            <button key={i} onClick={() => !trueBlocked && onSelect(k)} disabled={trueBlocked}
              style={{
                background: sel ? 'var(--lime)' : booked ? 'rgba(239,68,68,0.22)' : avail && !pt ? 'rgba(184,239,11,0.07)' : 'transparent',
                color: sel ? '#0d1b2a' : booked ? 'rgba(255,100,100,0.7)' : blocked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.82)',
                border: `1px solid ${sel ? 'var(--lime)' : booked ? 'rgba(239,68,68,0.6)' : avail && !pt ? 'rgba(184,239,11,0.25)' : 'transparent'}`,
                borderRadius: 5, padding: '5px 0', fontSize: 12,
                cursor: trueBlocked ? 'default' : 'pointer',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: sel ? 700 : 400,
                position: 'relative',
              }}>
              {d}
              {pCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, borderRadius: '50%', background: sel ? '#0d1b2a' : '#f97316' }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.35)', flexWrap: 'wrap' }}>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', marginRight: 4 }} />
          Disponible
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f97316', marginRight: 4 }} />
          Déjà demandé
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginRight: 4 }} />
          Réservé
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

/* Champ adresse avec suggestions Mapbox (autocomplete) */
function AddressAutocomplete({ value, onChange, onSelect, placeholder, onEnter, wrapperStyle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeAddress(v.trim());
      setSuggestions(results);
    }, 300);
  };

  const handleSelect = (s) => {
    onSelect(s);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', flex: '1 1 240px', ...wrapperStyle }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={(e) => { fo(e); setOpen(true); }}
        onBlur={(e) => { bl(e); setTimeout(() => setOpen(false), 150); }}
        onKeyDown={onEnter}
        style={{ ...IS, width: '100%' }} />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 110, marginBottom: 4,
          background: '#16242f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          overflow: 'hidden', boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
        }}>
          {suggestions.map((s, i) => (
            <div key={i} onMouseDown={() => handleSelect(s)}
              style={{
                padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,239,11,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
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

const BtnPrimary = ({ children, onClick, disabled, style, className }) => (
  <button onClick={onClick} disabled={disabled} className={className}
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

/* forcedProfil : null → écran de choix de profil (gate) ; 'particulier' ou 'professionnel' → tunnel démarré directement, sans gate */
export default function DevisFlow({ forcedProfil = null }) {
  const router = useRouter();

  /* ── Navigation tunnel ─────────────────────────────────────────── */
  const [profil, setProfil] = useState(forcedProfil || '');
  const [step,   setStep]   = useState(forcedProfil === 'particulier' ? 0 : forcedProfil === 'professionnel' ? 9 : -1);
  const [sent,        setSent]        = useState(false);
  const [qontoLoading, setQontoLoading] = useState(false);
  const [qontoError,   setQontoError]   = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [resumeOffer, setResumeOffer] = useState(null);
  const [checkingResume, setCheckingResume] = useState(false);
  const [dateUnavailableNotice, setDateUnavailableNotice] = useState(false);

  /* ── Analytics : un événement par étape du tunnel ──────────────── */
  const STEP_NAMES = {
    0: 'calendrier', 1: 'email', 2: 'evenement', 3: 'prestations',
    4: 'facturation', 5: 'recapitulatif',
    9: 'pro_besoin', 10: 'pro_contact', 19: 'pro_prestations_cible',
    20: 'pro_facturation', 21: 'pro_recapitulatif',
  };
  const stepStartRef = useRef(Date.now());

  useEffect(() => {
    if (step < 0) return;
    stepStartRef.current = Date.now();
    gtagEvent('funnel_step', {
      profil: profil || forcedProfil || '',
      step,
      step_name: STEP_NAMES[step] ?? `step_${step}`,
    });
  }, [step]);

  /* ── Abandon du tunnel ──────────────────────────────────────────── */
  useEffect(() => {
    const fireAbandon = () => {
      if (step < 0) return;
      gtagBeacon('funnel_abandon', {
        profil: profil || forcedProfil || '',
        step,
        step_name: STEP_NAMES[step] ?? `step_${step}`,
        time_spent_sec: Math.round((Date.now() - stepStartRef.current) / 1000),
      });
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') fireAbandon(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', fireAbandon);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', fireAbandon);
    };
  }, [step, profil, forcedProfil]);

  /* ── Google Calendar — dates déjà réservées ────────────────────── */
  const [bookedDates, setBookedDates] = useState(new Set());
  const [pendingDates, setPendingDates] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  useEffect(() => {
    const now   = new Date();
    const start = now.toISOString().slice(0, 10);
    const end   = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    fetch(`/api/availability?start=${start}&end=${end}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.bookedDates) setBookedDates(new Set(data.bookedDates));
        if (data.pendingDates) setPendingDates(data.pendingDates);
      })
      .catch(() => {})
      .finally(() => setAvailabilityLoading(false));
  }, []);

  /* ── Particulier — identité & événement ────────────────────────── */
  const [email,      setEmail]      = useState('');
  const [emailErr,   setEmailErr]   = useState('');
  const [prenom,     setPrenom]     = useState('');
  const [nom,        setNom]        = useState('');
  const [tel,        setTel]        = useState('');
  const [eventType,  setEventType]  = useState('Soirée privée');
  const [date,       setDate]       = useState('');
  const [lieu,       setLieu]       = useState('');
  const [lieuCoords, setLieuCoords] = useState(null);
  const [km,         setKm]         = useState(null);
  const [kmLoading,  setKmLoading]  = useState(false);

  /* ── Particulier — prestations ──────────────────────────────────── */
  const [needsMaterial, setNeedsMaterial] = useState(null);
  const [nbPersons,     setNbPersons]     = useState('');
  const [eclairOpts,    setEclairOpts]    = useState({ archi: false, etincelles: false, fumee: false });
  const [videoChoice,   setVideoChoice]   = useState('none');
  const [djDuration,    setDjDuration]    = useState(6);
  const [karaokeActive, setKaraokeActive] = useState(false);

  /* ── Particulier — facturation ─────────────────────────────────── */
  const [adresse, setAdresse] = useState('');
  const [cp,      setCp]      = useState('');
  const [ville,   setVille]   = useState('');

  /* ── Professionnel — prestation ciblée : configurateur ──────────── */
  const [cibleNbPersons,    setCibleNbPersons]    = useState('');
  const [cibleSonoActive,   setCibleSonoActive]   = useState(null);
  const [cibleMicroQty,     setCibleMicroQty]     = useState(0);
  const [cibleEclairActive, setCibleEclairActive] = useState(null);
  const [cibleEclairSalle,  setCibleEclairSalle]  = useState(false);
  const [cibleEclairArchi,  setCibleEclairArchi]  = useState(false);
  const [cibleDjActive,     setCibleDjActive]     = useState(null);
  const [cibleDjDuration,   setCibleDjDuration]   = useState(DJ_PRO_CFG.minDur);
  const [cibleKaraokeActive,setCibleKaraokeActive]= useState(null);
  const [cibleVideoChoice,  setCibleVideoChoice]  = useState('none');
  const [cibleVideoNeeded,  setCibleVideoNeeded]  = useState(null);

  /* ── Professionnel — prestation ciblée : entreprise & contact ───── */
  const [cibleSiret,   setCibleSiret]   = useState('');
  const [cibleSociete, setCibleSociete] = useState('');
  const [entSearch,    setEntSearch]    = useState('');
  const [entResults,   setEntResults]   = useState([]);
  const [entLoading,   setEntLoading]   = useState(false);
  const [entErr,       setEntErr]       = useState('');
  const [entSelected,  setEntSelected]  = useState(null);
  const [ciblePrenom,  setCiblePrenom]  = useState('');
  const [cibleNom,     setCibleNom]     = useState('');
  const [cibleEmail,   setCibleEmail]   = useState('');
  const [cibleTel,     setCibleTel]     = useState('');
  const [cibleDate,    setCibleDate]    = useState('');
  const [cibleEventType, setCibleEventType] = useState('');
  const [cibleLieu,    setCibleLieu]    = useState('');
  const [cibleLieuCoords, setCibleLieuCoords] = useState(null);
  const [cibleKm,      setCibleKm]      = useState(null);
  const [cibleKmLoading, setCibleKmLoading] = useState(false);
  const [cibleDesc,    setCibleDesc]    = useState('');

  /* ── Professionnel ─────────────────────────────────────────────── */
  const [proBesoin,   setProBesoin]   = useState(''); /* 'cible' | 'evenement' */
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

  /* ── Modal date bloquée ────────────────────────────────────────── */
  const [blockedDateModal, setBlockedDateModal] = useState(null);  /* date string ou null */
  const [blockedDateThankYou, setBlockedDateThankYou] = useState(false);

  /* ── Remise « signature rapide » ──────────────────────────────────
     Date limite calculée localement en attendant la confirmation serveur,
     qui fige la valeur pour ce couple (email, date d'événement) afin qu'un
     nouveau devis ne réinitialise pas le compte à rebours. */
  const [remiseDeadline, setRemiseDeadline] = useState(null);

  useEffect(() => {
    if (!date) { setRemiseDeadline(null); return; }
    setRemiseDeadline(getRemiseDeadline(date));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;
    fetch('/api/devis/remise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, date }),
    })
      .then(r => r.json())
      .then(({ deadline }) => {
        if (deadline) setRemiseDeadline(new Date(deadline + 'T00:00:00'));
      })
      .catch(() => {});
  }, [email, date]);

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
  const materialTotal = needsMaterial
    ? sonPrice + ECLAIR_BASE_PRICE + eclairOptTotal + videoPrice +
      (karaokeActive ? KARAOKE_PRICE : 0) + INSTALL_PRICE + techPrice
    : 0;
  const totalBrut     = materialTotal + djForFait + djXtraCost + kmFee;
  const remiseDate    = remiseDeadline
    ? remiseDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const totalNet      = remiseDeadline ? Math.round(totalBrut * 0.85) : totalBrut;
  const acompte60     = Math.round(totalNet * 0.6);
  const solde40       = totalNet - acompte60;

  /* ── Totaux — prestation ciblée pro (tarifs HT) ─────────────────── */
  const cibleNb          = parseInt(cibleNbPersons) || 0;
  const cibleSon         = getSonForfait(cibleNbPersons);
  const cibleSonPrice    = cibleSonoActive ? (cibleSon?.price ?? 0) : 0;
  const cibleMicroPrice  = cibleSonoActive ? cibleMicroQty * MICRO_PRICE : 0;
  const cibleEclairPrice = cibleEclairActive
    ? (ECLAIR_BASE_PRICE
      + (cibleEclairSalle ? ECLAIR_ARCHI_PRICE : 0)
      + (cibleEclairArchi ? ECLAIR_ARCHI_PRICE : 0))
    : 0;
  const cibleDjXtraHours = Math.max(0, cibleDjDuration - DJ_PRO_CFG.minDur);
  const cibleDjPrice     = cibleDjActive ? (DJ_PRO_CFG.forfait + cibleDjXtraHours * DJ_PRO_CFG.xph) : 0;
  const cibleKaraokePrice= cibleKaraokeActive ? KARAOKE_PRICE : 0;
  const cibleVideoPrice  = CIBLE_VIDEO_OPTS.find(v => v.id === cibleVideoChoice)?.price ?? 0;
  const cibleAnyEquip    = cibleSonoActive || cibleEclairActive || cibleDjActive || cibleKaraokeActive || cibleVideoChoice !== 'none';
  const cibleOnlyDj      = cibleDjActive && !cibleSonoActive && !cibleEclairActive && !cibleKaraokeActive && cibleVideoChoice === 'none';
  const cibleInstallPrice= (cibleAnyEquip && !cibleOnlyDj) ? INSTALL_PRICE : 0;
  const cibleKmFee       = cibleAnyEquip ? (getTransportFee(cibleKm) ?? 0) : 0;
  const cibleTotalHT     = cibleSonPrice + cibleMicroPrice + cibleEclairPrice + cibleDjPrice + cibleKaraokePrice + cibleVideoPrice + cibleInstallPrice + cibleKmFee;

  /* ── Actions ────────────────────────────────────────────────────── */
  const goBack = () => {
    if (step === -1) { router.back(); return; }
    if (step === 0 || step === 9) {
      if (forcedProfil) { router.back(); return; }
      setStep(-1); setProfil(''); return;
    }
    if (step === 10 || step === 19) { setStep(9); setProBesoin(''); return; }
    if (step === 20) { setStep(19); return; }
    if (step === 21) { setStep(20); return; }
    setStep(s => s - 1);
  };

  const goStep = (s) => { setStep(s); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const saveProgress = (currentStep) => {
    if (!email) return;
    fetch('/api/devis/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, step: currentStep,
        data: {
          prenom, nom, tel, eventType, date, lieu, lieuCoords, km,
          needsMaterial, nbPersons, eclairOpts, videoChoice, djDuration, karaokeActive,
          adresse, cp, ville,
        },
      }),
    }).catch(() => {});
  };

  const applyResumeData = ({ step: savedStep, data }) => {
    const dateUnavailable = data.date && bookedDates.has(data.date);
    if (data.prenom !== undefined) setPrenom(data.prenom);
    if (data.nom !== undefined) setNom(data.nom);
    if (data.tel !== undefined) setTel(data.tel);
    if (data.eventType !== undefined) setEventType(data.eventType);
    if (data.date !== undefined) setDate(dateUnavailable ? '' : data.date);
    if (data.lieu !== undefined) setLieu(data.lieu);
    if (data.lieuCoords !== undefined) setLieuCoords(data.lieuCoords);
    if (data.km !== undefined) setKm(data.km);
    if (data.needsMaterial !== undefined) setNeedsMaterial(data.needsMaterial);
    if (data.nbPersons !== undefined) setNbPersons(data.nbPersons);
    if (data.eclairOpts !== undefined) setEclairOpts(data.eclairOpts);
    if (data.videoChoice !== undefined) setVideoChoice(data.videoChoice);
    if (data.djDuration !== undefined) setDjDuration(data.djDuration);
    if (data.karaokeActive !== undefined) setKaraokeActive(data.karaokeActive);
    if (data.adresse !== undefined) setAdresse(data.adresse);
    if (data.cp !== undefined) setCp(data.cp);
    if (data.ville !== undefined) setVille(data.ville);
    setResumeOffer(null);
    setDateUnavailableNotice(dateUnavailable);
    goStep(dateUnavailable ? 0 : savedStep);
  };

  const validateEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailErr('Adresse invalide.');
      gtagEvent('funnel_error', { step: 1, step_name: 'email', error_type: 'email_invalide' });
      return;
    }
    if (!prenom || !nom || !tel || !/^[0-9+\s().-]{6,}$/.test(tel)) {
      gtagEvent('funnel_error', { step: 1, step_name: 'email', error_type: 'tel_invalide' });
      return;
    }
    setEmailErr('');
    setCheckingResume(true);
    try {
      const res = await fetch(`/api/devis/progress?email=${encodeURIComponent(email)}`);
      const { progress } = await res.json();
      if (progress && progress.step > 1) {
        setResumeOffer(progress);
        setCheckingResume(false);
        return;
      }
    } catch {}
    setCheckingResume(false);
    goStep(2);
  };

  const estimateKm = async () => {
    if (!lieu.trim()) return;
    setKmLoading(true);
    try {
      let coords = lieuCoords;
      if (!coords) {
        const results = await geocodeAddress(lieu.trim());
        coords = results[0]?.coords;
        if (coords) setLieuCoords(coords);
      }
      setKm(coords ? await getRoadKm(coords) : null);
    } finally {
      setKmLoading(false);
    }
  };

  const estimateCibleKm = async () => {
    if (!cibleLieu.trim()) return;
    setCibleKmLoading(true);
    try {
      let coords = cibleLieuCoords;
      if (!coords) {
        const results = await geocodeAddress(cibleLieu.trim());
        coords = results[0]?.coords;
        if (coords) setCibleLieuCoords(coords);
      }
      setCibleKm(coords ? await getRoadKm(coords) : null);
    } finally {
      setCibleKmLoading(false);
    }
  };

  const searchEntreprise = async () => {
    const q = entSearch.trim();
    if (!q) return;
    setEntLoading(true); setEntErr(''); setEntResults([]);
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=5`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const results = (data.results || []).map(r => ({
        siren: r.siren,
        siret: r.siege?.siret || '',
        nom: r.nom_complet || r.nom_raison_sociale || '—',
        adresse: r.siege?.adresse || '',
        cp: r.siege?.code_postal || '',
        ville: r.siege?.libelle_commune || '',
        forme: r.nature_juridique || '',
      }));
      if (results.length === 0) setEntErr('Aucune entreprise trouvée — vérifiez le nom ou le SIRET.');
      setEntResults(results);
    } catch {
      setEntErr('Recherche indisponible pour le moment — réessayez ou saisissez les informations manuellement.');
    } finally {
      setEntLoading(false);
    }
  };

  const validateEntreprise = (ent) => {
    setEntSelected(ent);
    setCibleSociete(ent.nom);
    setCibleSiret(ent.siret);
  };

  const submitDevisParticulier = async () => {
    setQontoLoading(true);
    setQontoError('');
    try {
      /* Distance > 600 km — hors grille tarifaire : on transmet la
         sélection du client pour qu'un conseiller établisse un devis sur
         mesure incluant les frais de déplacement. */
      if (km && getTransportFee(km) === null) {
        const items = [
          [`DJ (${djDuration}h)`, `${(djForFait + djXtraCost).toLocaleString('fr-FR')} €`],
          needsMaterial && son && [`Son (${son.label})`, `${son.price} €`],
          needsMaterial && ['Éclairage ambiance', `${ECLAIR_BASE_PRICE} €`],
          ...(needsMaterial ? ECLAIR_OPTS.filter(o => eclairOpts[o.id] && (!o.mariageOnly || eventType === 'Mariage')).map(o => [o.label, `${o.price} €`]) : []),
          needsMaterial && videoChoice !== 'none' && [VIDEO_OPTS.find(v => v.id === videoChoice)?.label, `${videoPrice} €`],
          needsMaterial && karaokeActive && ['Karaoké', `${KARAOKE_PRICE} €`],
          needsMaterial && ['Installation / désinstallation', `${INSTALL_PRICE} €`],
          needsMaterial && nb > 100 && ['Technicien journée', `${TECH_PRICE} €`],
          ['Distance estimée', `${km} km aller-retour`],
        ].filter(Boolean);

        // Devis Qonto en brouillon — il ne reste qu'à ajouter le tarif de
        // déplacement et l'envoyer au client.
        const qontoItems = [];
        if (needsMaterial) {
          if (son && sonPrice > 0) qontoItems.push({ title: 'Sonorisation', description: son.label, priceHT: sonPrice / 1.2 });
          const eclairTotal = ECLAIR_BASE_PRICE + eclairOptTotal;
          qontoItems.push({ title: 'Éclairage', priceHT: eclairTotal / 1.2 });
          if (videoPrice > 0) qontoItems.push({ title: VIDEO_OPTS.find(v => v.id === videoChoice)?.label || 'Vidéo', priceHT: videoPrice / 1.2 });
          if (karaokeActive) qontoItems.push({ title: 'Karaoké', priceHT: KARAOKE_PRICE / 1.2 });
          if (techPrice > 0) qontoItems.push({ title: 'Technicien son', description: 'Effectif > 100 personnes', priceHT: TECH_PRICE / 1.2 });
          qontoItems.push({ title: 'Installation / Démontage', priceHT: INSTALL_PRICE / 1.2 });
        }
        const djTotal = djForFait + djXtraCost;
        if (djTotal > 0) qontoItems.push({
          title: 'Animation DJ',
          description: djXtraHours > 0 ? `Forfait ${djCfg.minDur}h + ${djXtraHours}h complémentaire(s)` : `Forfait ${djCfg.minDur}h`,
          priceHT: djTotal / 1.2,
        });

        let quoteUrl = null;
        try {
          const qRes = await fetch('/api/qonto/devis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client: { type: 'individual', firstName: prenom, lastName: nom, email, phone: tel, adresse, cp, ville },
              event: { type: eventType, date, lieu, km },
              items: qontoItems,
              discountPct: remiseDeadline ? 0.15 : 0,
              remiseDeadline: remiseDeadline ? toLocalISODate(remiseDeadline) : null,
              draft: true,
              note: `Hors zone (${km} km) — ajouter les frais de déplacement avant envoi`,
            }),
          });
          const qData = await qRes.json();
          if (qRes.ok) quoteUrl = qData.quoteUrl;
        } catch {}

        const res = await fetch('/api/contact/hors-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profil: 'particulier', prenom, nom, email, tel,
            eventType, date, lieu, km, items,
            totalPartiel: `${totalBrut.toLocaleString('fr-FR')} € TTC`,
            quoteUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setSent(true);
        gtagEvent('generate_lead', { profil: 'particulier', hors_zone: true, currency: 'EUR', value: totalBrut });
        fetch('/api/devis/progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {});
        return;
      }

      const items = [];
      if (needsMaterial) {
        if (son && sonPrice > 0) items.push({ title: 'Sonorisation', description: son.label, priceHT: sonPrice / 1.2 });
        const eclairTotal = ECLAIR_BASE_PRICE + eclairOptTotal;
        items.push({ title: 'Éclairage', priceHT: eclairTotal / 1.2 });
        if (videoPrice > 0) items.push({ title: VIDEO_OPTS.find(v => v.id === videoChoice)?.label || 'Vidéo', priceHT: videoPrice / 1.2 });
        if (karaokeActive) items.push({ title: 'Karaoké', priceHT: KARAOKE_PRICE / 1.2 });
        if (techPrice > 0) items.push({ title: 'Technicien son', description: 'Effectif > 100 personnes', priceHT: TECH_PRICE / 1.2 });
        items.push({ title: 'Installation / Démontage', priceHT: INSTALL_PRICE / 1.2 });
      }
      const djTotal = djForFait + djXtraCost;
      if (djTotal > 0) items.push({
        title: 'Animation DJ',
        description: djXtraHours > 0 ? `Forfait ${djCfg.minDur}h + ${djXtraHours}h complémentaire(s)` : `Forfait ${djCfg.minDur}h`,
        priceHT: djTotal / 1.2,
      });
      if (kmFee > 0) items.push({ title: 'Frais de déplacement', description: `${km} km aller-retour`, priceHT: kmFee / 1.2 });

      const res = await fetch('/api/qonto/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { type: 'individual', firstName: prenom, lastName: nom, email, phone: tel, adresse, cp, ville },
          event: { type: eventType, date, lieu, km },
          items,
          discountPct: remiseDeadline ? 0.15 : 0,
          remiseDeadline: remiseDeadline ? toLocalISODate(remiseDeadline) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSent(true);
      gtagEvent('generate_lead', { profil: 'particulier', hors_zone: false, currency: 'EUR', value: totalBrut });
      fetch('/api/devis/progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    } catch {
      setQontoError('Erreur lors de l\'envoi — veuillez réessayer.');
    } finally {
      setQontoLoading(false);
    }
  };

  const submitDevisPro = async () => {
    setQontoLoading(true);
    setQontoError('');
    try {
      /* Distance > 600 km — hors grille tarifaire : on transmet la
         sélection du client pour qu'un conseiller établisse un devis sur
         mesure incluant les frais de déplacement. */
      if (cibleKm && getTransportFee(cibleKm) === null) {
        const items = [
          cibleSonoActive && cibleSonPrice > 0 && [`Sonorisation (${cibleSon?.label || ''})`, `${cibleSonPrice} € HT`],
          cibleMicroPrice > 0 && [`Microphones supplémentaires (×${cibleMicroQty})`, `${cibleMicroPrice} € HT`],
          cibleEclairPrice > 0 && ['Éclairage', `${cibleEclairPrice} € HT`],
          cibleDjPrice > 0 && [`Animation DJ (${cibleDjDuration}h)`, `${cibleDjPrice} € HT`],
          cibleKaraokePrice > 0 && ['Karaoké', `${cibleKaraokePrice} € HT`],
          cibleVideoPrice > 0 && [CIBLE_VIDEO_OPTS.find(v => v.id === cibleVideoChoice)?.label || 'Vidéo', `${cibleVideoPrice} € HT`],
          cibleInstallPrice > 0 && ['Installation / Démontage', `${cibleInstallPrice} € HT`],
          ['Distance estimée', `${cibleKm} km aller-retour`],
        ].filter(Boolean);

        // Devis Qonto en brouillon — il ne reste qu'à ajouter le tarif de
        // déplacement et l'envoyer au client.
        const qontoItems = [];
        if (cibleSonoActive && cibleSonPrice > 0) qontoItems.push({ title: 'Sonorisation', description: cibleSon?.label || '', priceHT: cibleSonPrice });
        if (cibleMicroPrice > 0) qontoItems.push({ title: `Microphones supplémentaires (×${cibleMicroQty})`, priceHT: cibleMicroPrice });
        if (cibleEclairPrice > 0) qontoItems.push({ title: 'Éclairage', priceHT: cibleEclairPrice });
        if (cibleDjPrice > 0) qontoItems.push({
          title: 'Animation DJ',
          description: cibleDjXtraHours > 0 ? `Forfait ${DJ_PRO_CFG.minDur}h + ${cibleDjXtraHours}h complémentaire(s)` : `Forfait ${DJ_PRO_CFG.minDur}h minimum`,
          priceHT: cibleDjPrice,
        });
        if (cibleKaraokePrice > 0) qontoItems.push({ title: 'Karaoké', priceHT: cibleKaraokePrice });
        if (cibleVideoPrice > 0) qontoItems.push({ title: CIBLE_VIDEO_OPTS.find(v => v.id === cibleVideoChoice)?.label || 'Vidéo', priceHT: cibleVideoPrice });
        if (cibleInstallPrice > 0) qontoItems.push({ title: 'Installation / Démontage', priceHT: cibleInstallPrice });

        let quoteUrl = null;
        try {
          const qRes = await fetch('/api/qonto/devis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client: { type: 'company', firstName: ciblePrenom, lastName: cibleNom, email: cibleEmail, phone: cibleTel, societe: cibleSociete, siret: cibleSiret, adresse: entSelected?.adresse || '', cp: entSelected?.cp || '', ville: entSelected?.ville || '' },
              event: { type: cibleEventType, date: cibleDate, lieu: cibleLieu, km: cibleKm },
              items: qontoItems,
              discountPct: 0,
              draft: true,
              note: `Hors zone (${cibleKm} km) — ajouter les frais de déplacement avant envoi`,
            }),
          });
          const qData = await qRes.json();
          if (qRes.ok) quoteUrl = qData.quoteUrl;
        } catch {}

        const res = await fetch('/api/contact/hors-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profil: 'professionnel', prenom: ciblePrenom, nom: cibleNom, email: cibleEmail, tel: cibleTel,
            societe: cibleSociete, eventType: cibleEventType, date: cibleDate, lieu: cibleLieu, km: cibleKm, items,
            totalPartiel: `${cibleTotalHT.toLocaleString('fr-FR')} € HT`,
            quoteUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setSent(true);
        gtagEvent('generate_lead', { profil: 'professionnel', hors_zone: true, currency: 'EUR', value: cibleTotalHT });
        return;
      }

      const items = [];
      if (cibleSonoActive && cibleSonPrice > 0) items.push({ title: 'Sonorisation', description: cibleSon?.label || '', priceHT: cibleSonPrice });
      if (cibleMicroPrice > 0) items.push({ title: `Microphones supplémentaires (×${cibleMicroQty})`, priceHT: cibleMicroPrice });
      if (cibleEclairPrice > 0) items.push({ title: 'Éclairage', priceHT: cibleEclairPrice });
      if (cibleDjPrice > 0) items.push({
        title: 'Animation DJ',
        description: cibleDjXtraHours > 0 ? `Forfait ${DJ_PRO_CFG.minDur}h + ${cibleDjXtraHours}h complémentaire(s)` : `Forfait ${DJ_PRO_CFG.minDur}h minimum`,
        priceHT: cibleDjPrice,
      });
      if (cibleKaraokePrice > 0) items.push({ title: 'Karaoké', priceHT: cibleKaraokePrice });
      if (cibleVideoPrice > 0) items.push({ title: CIBLE_VIDEO_OPTS.find(v => v.id === cibleVideoChoice)?.label || 'Vidéo', priceHT: cibleVideoPrice });
      if (cibleInstallPrice > 0) items.push({ title: 'Installation / Démontage', priceHT: cibleInstallPrice });
      if (cibleKmFee > 0) items.push({ title: 'Frais de déplacement', description: `${cibleKm} km aller-retour`, priceHT: cibleKmFee });

      const res = await fetch('/api/qonto/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { type: 'company', firstName: ciblePrenom, lastName: cibleNom, email: cibleEmail, phone: cibleTel, societe: cibleSociete, siret: cibleSiret, adresse: entSelected?.adresse || '', cp: entSelected?.cp || '', ville: entSelected?.ville || '' },
          event: { type: cibleEventType, date: cibleDate, lieu: cibleLieu, km: cibleKm },
          items,
          discountPct: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSent(true);
      gtagEvent('generate_lead', { profil: 'professionnel', hors_zone: false, currency: 'EUR', value: cibleTotalHT });
    } catch {
      setQontoError('Erreur lors de l\'envoi — veuillez réessayer.');
    } finally {
      setQontoLoading(false);
    }
  };

  const submitContactPro = async () => {
    setQontoLoading(true);
    setQontoError('');
    try {
      const res = await fetch('/api/contact/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: proPrenom, nom: proNom, societe: proSociete, email: proEmail, tel: proTel, poste: proPoste,
          type: proType, personnes: proPersonnes, date: proDate, budget: proBudget, lieu: proLieu, description: proDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSent(true);
      gtagEvent('generate_lead', { profil: 'professionnel', contact_only: true });
    } catch {
      setQontoError('Erreur lors de l\'envoi — veuillez réessayer.');
    } finally {
      setQontoLoading(false);
    }
  };

  /* ── Progress bar ───────────────────────────────────────────────── */
  const isPart = profil === 'particulier' && step >= 0 && step <= 4;
  const isPro  = profil === 'professionnel' && step >= 9;

  const Header = () => (
    <div className="devis-tunnel-header" style={{
      background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 28px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 70, zIndex: 80,
    }}>
      <button onClick={goBack} className="hide-mobile" style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
      }}>← Retour</button>

      {(isPart || isPro) ? (
        <div className="hide-mobile" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
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
      ) : <div className="hide-mobile" style={{ width: 80 }} />}
    </div>
  );

  /* Barre étape mobile — affichée au-dessus du titre, masquée sur desktop */
  const MobileStepBar = ({ current, total }) => (
    <div className="hide-desktop" style={{
      position: 'fixed', top: 70, left: 0, right: 0, zIndex: 75,
      background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 52, padding: '0 20px',
    }}>
      <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: 0,
        fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
      }}>← Retour</button>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => {
          const done = current > i;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? 'var(--lime)' : 'rgba(255,255,255,0.07)',
                color: done ? '#0d1b2a' : 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 10,
                transition: 'all 0.3s',
              }}>{i + 1}</div>
              {i < total - 1 && (
                <div style={{ width: 12, height: 1, background: done ? 'var(--lime)' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* Détail de la sélection — lignes de prix + total, réutilisé dans le panneau flottant et la fenêtre mobile */
  const BreakdownLines = ({ lines, total, totalLabel, unit = '€', savings = 0 }) => {
    const subtotal = savings > 0 ? total + savings : 0;
    return (
      <>
        {lines.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{k}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>{v.toLocaleString('fr-FR')} {unit}</span>
          </div>
        ))}
        {savings > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '6px 0 2px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, color: 'rgba(255,255,255,0.45)' }}>
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString('fr-FR')} {unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0 6px', color: 'var(--lime)' }}>
              <span>Remise −15 %</span>
              <span>−{savings.toLocaleString('fr-FR')} {unit}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: savings > 0 ? 6 : 10, marginTop: savings > 0 ? 0 : 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{totalLabel}</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)' }}>{total.toLocaleString('fr-FR')} {unit}</span>
        </div>
      </>
    );
  };

  /* Panneau flottant — détail par catégorie, masqué sur mobile/tablette (remplacé par DetailToggle + DetailModal) */
  const BreakdownPanel = ({ lines, total, totalLabel, unit, savings }) => lines.length > 0 && (
    <div className="detail-breakdown" style={{
      position: 'fixed', top: 110, right: 24, width: 230, zIndex: 40,
      background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
      padding: '14px 16px',
    }}>
      <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 10 }}>
        Détail de votre sélection
      </div>
      <BreakdownLines lines={lines} total={total} totalLabel={totalLabel} unit={unit} savings={savings} />
    </div>
  );

  /* Lien "Voir le détail" — affiché uniquement sur mobile/tablette, à côté du total estimé */
  const DetailToggle = () => (
    <button onClick={() => setShowDetailModal(true)} className="detail-toggle-btn" style={{
      display: 'none', background: 'none', border: 'none', color: 'var(--lime)',
      fontSize: 12, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
      textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 4,
    }}>
      Voir le détail
    </button>
  );

  /* Fenêtre de détail — version mobile/tablette, ouverte via DetailToggle */
  const DetailModal = ({ lines, total, totalLabel, unit, savings }) => showDetailModal && (
    <div onClick={() => setShowDetailModal(false)} style={{
      position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(6,14,22,0.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: 'rgba(13,27,42,0.97)',
        border: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 16, borderTopRightRadius: 16,
        padding: '18px 20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', fontWeight: 700 }}>
            Détail de votre sélection
          </div>
          <button onClick={() => setShowDetailModal(false)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0,
          }}>✕</button>
        </div>
        <BreakdownLines lines={lines} total={total} totalLabel={totalLabel} unit={unit} savings={savings} />
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     ÉTAPES PARTICULIER
  ══════════════════════════════════════════════════════════════════ */

  /* Gate — choix du profil */
  const renderGate = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      <button onClick={goBack} className="hide-desktop" style={{
        position: 'absolute', top: 16, left: 16,
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: 0,
        fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
      }}>← Retour</button>
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        <AnimatedWave bars={36} height={60} style={{ maxWidth: 480, margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, marginBottom: 8 }}>
          Parlons de votre événement
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, marginBottom: 36, lineHeight: 1.7 }}>
          Choisissez votre profil.
        </p>
        <div className="gate-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ProfileCard icon="🏢" title="Professionnel"
            onClick={() => router.push('/professionnel')} />
          <ProfileCard icon="🎉" title="Particulier"
            onClick={() => router.push('/particulier')} />
        </div>
        <p style={{ color: 'var(--lime)', fontSize: 12, fontWeight: 600, marginTop: 20 }}>
          Devis gratuit, sans engagement
        </p>
      </div>
    </div>
  );

  /* Étape 0 — Date */
  const renderStep0 = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <MobileStepBar current={0} total={6} />
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 8 }}>
          Quelle est la date de votre événement ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Vérifiez notre disponibilité avant de continuer.
        </p>
        <MiniCal
          selected={date}
          onSelect={d => {
            if (bookedDates.has(d)) {
              setBlockedDateThankYou(false);
              setBlockedDateModal(d);
            } else {
              setDate(d);
            }
          }}
          devisPending={pendingDates}
          bookedDates={bookedDates}
          loading={availabilityLoading}
        />
        {date && (pendingDates[date] ?? 0) > 0 && (
          <div style={{ margin: '8px 0 12px', padding: '10px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 8, fontSize: 12, color: '#f97316', lineHeight: 1.6, textAlign: 'left' }}>
            ⚠️ <strong>{pendingDates[date]} devis déjà demandé{pendingDates[date] > 1 ? 's' : ''}</strong> pour cette date — répondez rapidement à notre appel pour être prioritaire.
          </div>
        )}
        {date && (
          <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(184,239,11,0.07)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>
            ✓ Disponible — {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <BtnPrimary
          onClick={() => goStep(1)}
          disabled={!date}
          style={{ width: '100%', marginTop: date ? 4 : 16 }}
        >
          Continuer →
        </BtnPrimary>
        {!date && (
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 12 }}>
            Sélectionnez une date pour continuer.
          </p>
        )}
      </div>

      {/* Modal — date bloquée */}
      {blockedDateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(6,14,22,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 420,
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '28px 24px', textAlign: 'center',
          }}>
            {!blockedDateThankYou ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                  Date non disponible
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
                  Le <strong style={{ color: '#fff' }}>{new Date(blockedDateModal + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> est déjà réservé.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                  Choisissez une autre date pour continuer votre devis, ou confirmez si vous tenez absolument à cette date.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <BtnPrimary onClick={() => setBlockedDateModal(null)} style={{ width: '100%' }}>
                    Choisir une autre date
                  </BtnPrimary>
                  <button
                    onClick={() => setBlockedDateThankYou(true)}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, color: 'rgba(255,255,255,0.5)',
                      padding: '11px 16px', cursor: 'pointer', fontSize: 13,
                      fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
                    }}
                  >
                    Je tiens absolument à cette date
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🙏</div>
                <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                  Merci pour votre confiance
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  Votre intérêt pour le <strong style={{ color: '#fff' }}>{new Date(blockedDateModal + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> a bien été noté. Nous sommes malheureusement déjà engagés ce jour-là et ne pouvons pas honorer deux prestations simultanées.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                  Si une autre date vous convient, nous serons ravis de vous accompagner. N'hésitez pas à nous contacter directement au <strong style={{ color: 'rgba(255,255,255,0.7)' }}>07 68 53 33 08</strong>.
                </p>
                <BtnPrimary onClick={() => setBlockedDateModal(null)} style={{ width: '100%' }}>
                  Choisir une autre date
                </BtnPrimary>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /* Étape 1 — Email + Identité */
  const renderStep1 = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <MobileStepBar current={1} total={6} />
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(14px,2vw,19px)', fontWeight: 700, marginBottom: 16, textAlign: 'center', whiteSpace: 'nowrap' }}>
          Réalisez votre devis en moins de 2 minutes
        </h2>
        <AnimatedWave bars={28} height={48} style={{ maxWidth: 380, margin: '0 auto 24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input placeholder="Prénom *" value={prenom} onChange={e => setPrenom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          <input placeholder="Nom *" value={nom} onChange={e => setNom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        </div>
        <input type="tel" placeholder="Téléphone *" value={tel} onChange={e => setTel(e.target.value)}
          style={{ ...IS, marginBottom: 10 }} onFocus={fo} onBlur={bl} />
        {tel.trim() && !/^[0-9+\s().-]{6,}$/.test(tel) && (
          <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10, textAlign: 'left' }}>⚠ Numéro invalide — chiffres uniquement</p>
        )}

        <input type="email" placeholder="votre@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
          onFocus={fo} onBlur={bl}
          onKeyDown={e => e.key === 'Enter' && validateEmail()}
          style={{ ...IS, textAlign: 'center', fontSize: 16, marginBottom: emailErr ? 6 : 14 }} />
        {emailErr && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10, textAlign: 'left' }}>{emailErr}</p>}

        <BtnPrimary onClick={validateEmail}
          disabled={checkingResume || !prenom || !nom || !tel || !/^[0-9+\s().-]{6,}$/.test(tel)}
          style={{ width: '100%' }}>
          {checkingResume ? 'Vérification…' : 'Continuer →'}
        </BtnPrimary>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>
          Devis instantané · Rappel sous 24h · Gratuit & sans engagement
        </p>
      </div>
      {resumeOffer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(6,14,22,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 420, background: 'rgba(13,27,42,0.97)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '24px 22px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
              Vous avez un devis en cours
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Voulez-vous reprendre votre devis là où vous l'avez laissé, ou recommencer à zéro ?
            </p>
            {resumeOffer.data?.date && bookedDates.has(resumeOffer.data.date) && (
              <div style={{ padding: '10px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 8, fontSize: 12, color: '#f97316', lineHeight: 1.6, marginBottom: 16, textAlign: 'left' }}>
                ⚠ La date que vous aviez choisie ({new Date(resumeOffer.data.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}) n'est plus disponible — vous pourrez en choisir une nouvelle en reprenant votre devis.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <BtnPrimary onClick={() => applyResumeData(resumeOffer)} style={{ width: '100%' }}>
                Reprendre mon devis →
              </BtnPrimary>
              <button onClick={() => { setResumeOffer(null); goStep(2); }} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                color: 'rgba(255,255,255,0.6)', padding: '10px 16px', cursor: 'pointer',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 500, fontSize: 13,
              }}>Recommencer à zéro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* Étape 2 — Événement + lieu */
  const renderStep2 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={2} total={6} />
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Votre événement
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Étape 2 sur 6 · Type d'événement & lieu</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Événement */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
            📅 Votre événement
          </div>
          {/* Date — lecture seule, choisie à l'étape 0 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.18)', borderRadius: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>
              ✓ {date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>
            <button onClick={() => goStep(0)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12,
              cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
            }}>Modifier</button>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Type d'événement</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Soirée privée', 'Mariage', 'PACS', 'Anniversaire', 'EVJF / EVG', 'Baptême', 'Communion', 'Fête familiale', 'Autre'].map(t => (
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

        {/* Lieu */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
            📍 Lieu de l'événement
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: km ? 12 : 0 }}>
            <AddressAutocomplete placeholder="Adresse complète de la salle / lieu"
              value={lieu}
              onChange={v => { setLieu(v); setLieuCoords(null); setKm(null); }}
              onSelect={s => { setLieu(s.label); setLieuCoords(s.coords); }}
              onEnter={e => e.key === 'Enter' && estimateKm()} />
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
          {km && getTransportFee(km) === null && (
            <div style={{
              padding: '12px 14px', background: 'rgba(249,115,22,0.07)',
              border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, fontSize: 13,
            }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', marginBottom: 2 }}>Distance estimée</span>
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: '#f97316' }}>{km} km</span>
              </div>
              <div style={{ color: '#f97316', fontSize: 12, lineHeight: 1.6 }}>
                Distance supérieure à 600 km — hors de notre simulateur en ligne. Contactez-nous pour un devis sur mesure.
              </div>
            </div>
          )}
          {km && getTransportFee(km) !== null && (
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
          {lieu.trim() && !km && !kmLoading && (
            <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginTop: 10 }}>
              ⚠ Cliquez sur "Estimer le trajet" pour valider l'adresse avant de continuer
            </p>
          )}
        </div>

        <div onClickCapture={() => {
          if (!lieu.trim() || !km) gtagEvent('funnel_error', { step: 2, step_name: 'evenement', error_type: 'lieu_sans_estimation' });
        }}>
          <BtnPrimary onClick={() => { goStep(3); saveProgress(3); }} disabled={!date || !lieu.trim() || !km}>
            Continuer →
          </BtnPrimary>
        </div>
      </div>
    </div>
  );

  /* Étape 3 — Prestations */
  const renderStep3 = () => (
    <div style={{ flex: 1, padding: '28px 24px 130px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={3} total={6} />
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos prestations
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12 }}>Étape 3 sur 6 · Configurez votre événement</p>
      {remiseDeadline && (
        <div style={{ marginBottom: 20, padding: '11px 14px', background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>💸</span>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            <span style={{ color: 'var(--lime)', fontWeight: 700 }}>−15% de remise</span> appliqués automatiquement sur votre devis — signez avant le {remiseDate} pour en bénéficier.
          </p>
        </div>
      )}

      {/* Détail par catégorie — flottant en haut à droite (desktop) / fenêtre mobile via "Voir le détail" */}
      {(() => {
        const lines = [
          ['Animation DJ', djForFait + djXtraCost],
          kmFee > 0                            && ['Déplacement', kmFee],
          needsMaterial && son                 && ['Sonorisation', sonPrice],
          needsMaterial                        && ['Éclairage', ECLAIR_BASE_PRICE + eclairOptTotal],
          needsMaterial && karaokeActive       && ['Karaoké', KARAOKE_PRICE],
          needsMaterial && videoChoice !== 'none' && ['Vidéo & Écrans', videoPrice],
          needsMaterial                        && ['Installation & désinstallation', INSTALL_PRICE],
          needsMaterial && techPrice > 0       && ['Technicien journée', techPrice],
        ].filter(Boolean);
        const total = remiseDeadline ? totalNet : totalBrut;
        const savings = remiseDeadline ? totalBrut - totalNet : 0;
        return (
          <>
            <BreakdownPanel lines={lines} total={total} totalLabel="TOTAL TTC" savings={savings} />
            <DetailModal    lines={lines} total={total} totalLabel="TOTAL TTC" savings={savings} />
          </>
        );
      })()}

      {/* DJ en premier — toujours affiché */}
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
            {djCfg.forfait + djXtraCost} €
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: 'rgba(184,239,11,0.04)' }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 10 }}>
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
                  {' '}+ {djXtraHours}h compl. · <span style={{ color: 'var(--lime)', fontWeight: 700 }}>+{djXtraCost} €</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </PackBlock>

      {/* Frais de déplacement — affichés dès qu'un trajet a été estimé à l'étape 1 */}
      {kmFee > 0 && (
        <PackBlock title="🚗 Frais de déplacement" badge="INCLUS" badgeColor="rgba(255,255,255,0.22)">
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                ✓ Trajet jusqu'au lieu de votre événement
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                Calculés selon la distance estimée — déjà inclus dans le tarif affiché ci-dessous
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
              {kmFee} €
            </div>
          </div>
        </PackBlock>
      )}
      {km && getTransportFee(km) === null && (
        <PackBlock title="🚗 Frais de déplacement" badge="À DÉTERMINER" badgeColor="#f97316">
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: '#f97316', marginBottom: 3 }}>
              ⚠ Distance hors zone ({km} km)
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Non inclus dans le total ci-dessous — un conseiller vous proposera un tarif sur mesure.
            </div>
          </div>
        </PackBlock>
      )}

      {/* Question matériel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 14 }}>
          🎛 Le DJ doit-il apporter son équipement ?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => setNeedsMaterial(true)}
            style={{
              padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: needsMaterial === true ? 'rgba(184,239,11,0.08)' : 'transparent',
              border: `1px solid ${needsMaterial === true ? 'var(--lime)' : 'rgba(255,255,255,0.1)'}`,
              color: needsMaterial === true ? 'var(--lime)' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s',
            }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
              {needsMaterial === true ? '✓ ' : ''}Oui, qu'il amène tout
            </div>
            <div style={{ fontSize: 11, color: needsMaterial === true ? 'rgba(184,239,11,0.6)' : 'rgba(255,255,255,0.35)' }}>À configurer juste après selon votre événement</div>
          </button>
          <button onClick={() => setNeedsMaterial(false)}
            style={{
              padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: needsMaterial === false ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: `1px solid ${needsMaterial === false ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: needsMaterial === false ? 'white' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s',
            }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
              {needsMaterial === false ? '✓ ' : ''}Non, j'ai déjà mon matériel sur place
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Le DJ utilise mon installation existante</div>
          </button>
        </div>
      </div>

      {/* Matériel complet — affiché uniquement si needsMaterial === true */}
      {needsMaterial === true && (
        <>
          {/* Nombre de personnes */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              👥 Nombre de personnes
            </span>
            <input type="number" min={50} max={2000} placeholder="Min. 50"
              value={nbPersons} onChange={e => setNbPersons(e.target.value)}
              onBlur={e => { bl(e); const v = parseInt(e.target.value) || 0; if (v > 0 && v < 50) setNbPersons('50'); }}
              style={{ ...IS, width: 110, textAlign: 'center', fontSize: 17, fontWeight: 700 }}
              onFocus={fo} />
            {nb > 0 && (
              <div style={{ fontSize: 12, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>
                ✓ {nb.toLocaleString('fr-FR')} personnes
              </div>
            )}
          </div>
          {nb === 0 && (
            <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginBottom: 10 }}>
              ⚠ Indiquez le nombre de personnes pour continuer (minimum 50)
            </p>
          )}
          {nb > 100 && (
            <div style={{ fontSize: 12, color: '#f97316', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              👨‍🔧 Événement de plus de 100 personnes — technicien journée inclus automatiquement · <strong>+{TECH_PRICE} €</strong>
            </div>
          )}

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
          <PackBlock title="💡 Éclairage et effets" badge="OBLIGATOIRE" badgeColor="#f87171">
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                  ✓ Mise en lumière piste de danse — machine à fumée incluse
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Inclus obligatoirement dans chaque prestation</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
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

          {/* Karaoké */}
          <PackBlock title="🎤 Karaoké" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
            <ToggleRow label="Ajouter un système karaoké" price={KARAOKE_PRICE}
              checked={karaokeActive}
              onChange={() => setKaraokeActive(v => !v)}
            />
          </PackBlock>

          {/* Vidéo */}
          <PackBlock title="🎬 Vidéo & Écrans" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
            {VIDEO_OPTS.map(o => (
              <RadioRow key={o.id}
                label={o.id === 'none' && karaokeActive ? 'Je mets un écran à disposition du DJ' : o.label}
                note={o.id === 'none' && karaokeActive ? 'Vous fournissez l\'écran nécessaire au karaoké' : ''}
                price={o.price}
                selected={videoChoice === o.id}
                onSelect={() => setVideoChoice(o.id)}
              />
            ))}
          </PackBlock>

          {/* Installation / désinstallation — toujours incluse quand Myracoustic fournit le matériel */}
          <PackBlock title="🔧 Installation & désinstallation" badge="OBLIGATOIRE" badgeColor="#f87171">
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                  ✓ Montage et démontage du matériel sur place
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  Obligatoire dès que Myracoustic fournit le matériel
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
                {INSTALL_PRICE} €
              </div>
            </div>
          </PackBlock>
        </>
      )}

      {/* Barre totale fixe */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(184,239,11,0.25)', padding: '13px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            Total estimé TTC {kmFee > 0 && `· dont ${kmFee} € déplacement`} {km && getTransportFee(km) === null && '· hors frais de déplacement'} {remiseDeadline && '· remise -15 % appliquée'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 'clamp(18px,3vw,28px)', color: 'var(--lime)' }}>
              <AnimatedPrice value={remiseDeadline ? totalNet : totalBrut} /> €
            </div>
            {remiseDeadline && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>
                {totalBrut.toLocaleString('fr-FR')} €
              </div>
            )}
          </div>
          <DetailToggle />
        </div>
        <BtnPrimary onClick={() => { goStep(4); saveProgress(4); }} disabled={needsMaterial === null || (needsMaterial === true && (nb < 50 || !son))}>
          Valider mon devis →
        </BtnPrimary>
      </div>
    </div>
  );

  /* Étape 4 — Facturation */
  const renderStep4 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={4} total={6} />
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Adresse de facturation
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Étape 4 sur 6 · Coordonnées de facturation</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AddressAutocomplete placeholder="Numéro et rue *" value={adresse}
          onChange={v => setAdresse(v)}
          onSelect={s => { setAdresse(s.street); if (s.postcode) setCp(s.postcode); if (s.city) setVille(s.city); }}
          wrapperStyle={{ flex: 'none', width: '100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
          <input placeholder="Code postal *" value={cp}
            onChange={e => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
            inputMode="numeric" maxLength={5}
            style={IS} onFocus={fo} onBlur={bl} />
          <input placeholder="Ville *" value={ville} onChange={e => setVille(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        </div>
        <BtnPrimary onClick={() => { goStep(5); saveProgress(5); }} disabled={!adresse || !cp || !ville} style={{ marginTop: 8 }}>
          Continuer →
        </BtnPrimary>
        {(!adresse || !cp || !ville) && (
          <p style={{ fontSize: 12, color: 'rgba(249,115,22,0.85)', marginTop: 6 }}>
            ⚠ Champs obligatoires manquants : {[
              !adresse && 'Numéro et rue', !cp && 'Code postal', !ville && 'Ville',
            ].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );

  /* Étape 5 — Récapitulatif */
  const renderStep5 = () => {
    const isHorsZone = km && getTransportFee(km) === null;

    if (sent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <AnimatedWave bars={32} height={56} style={{ maxWidth: 420, margin: '0 auto 24px' }} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 700, marginBottom: 10 }}>
            {isHorsZone ? 'Votre demande a bien été reçue !' : 'Votre devis a été envoyé !'}
          </h2>
          {isHorsZone ? (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
                Votre événement se situe au-delà de notre zone de déplacement standard (600 km).
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
                Un conseiller vous recontacte sous 24 à 48h avec un devis sur mesure incluant les frais de déplacement.
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
                Votre devis vient de vous être envoyé par e-mail à <strong style={{ color: 'white' }}>{email}</strong>, à titre indicatif.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
                Un conseiller vous contacte sous 24h pour faire le point sur votre événement. À l'issue de cet échange, vous recevrez le devis définitif, prêt à signer en ligne.
              </p>
            </>
          )}
          {remiseDeadline && (
            <div style={{ background: 'rgba(184,239,11,0.07)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)', marginBottom: 4 }}>
                ⏰ Remise 15 % — valable si confirmé avant le {remiseDate}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
                Total remisé : <strong style={{ color: 'var(--lime)' }}>{totalNet.toLocaleString('fr-FR')} € TTC</strong> au lieu de {totalBrut.toLocaleString('fr-FR')} €.
              </div>
            </div>
          )}
          <a href="https://myracoustic.com" style={{
            background: 'var(--lime)', color: '#0d1b2a', border: 'none', cursor: 'pointer',
            padding: '13px 30px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', display: 'inline-block',
          }}>Retour à l'accueil</a>
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
      km && ['Déplacement', getTransportFee(km) === null ? `${km} km aller-retour · à déterminer (hors zone)` : `${km} km aller-retour · forfait ${kmFee} €`],
      ['Adresse de facturation', `${adresse}, ${cp} ${ville}`],
    ].filter(Boolean);

    const prestLines = [
      [`DJ (${djDuration}h)`, djForFait + djXtraCost],
      needsMaterial && son && [`Son (${son.label})`, son.price],
      needsMaterial && ['Éclairage ambiance', ECLAIR_BASE_PRICE],
      ...(needsMaterial ? ECLAIR_OPTS.filter(o => eclairOpts[o.id] && (!o.mariageOnly || eventType === 'Mariage')).map(o => [o.label, o.price]) : []),
      needsMaterial && videoChoice !== 'none' && [VIDEO_OPTS.find(v => v.id === videoChoice)?.label, videoPrice],
      needsMaterial && karaokeActive && ['Karaoké', KARAOKE_PRICE],
      needsMaterial && ['Installation / désinstallation', INSTALL_PRICE],
      needsMaterial && nb > 100 && ['Technicien journée', TECH_PRICE],
      kmFee > 0 && ['Forfait déplacement', kmFee],
    ].filter(Boolean);

    return (
      <div className="step4-container" style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <MobileStepBar current={5} total={6} />
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
          Récapitulatif
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Étape 5 sur 6 · Vérifiez et envoyez</p>

        {/* Remise */}
        {remiseDeadline && (
          <div style={{ background: 'rgba(184,239,11,0.07)', border: '1px solid rgba(184,239,11,0.22)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--lime)' }}>
                ⏰ Remise 15 % si vous signez avant le {remiseDate}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', fontSize: 17 }}>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>TOTAL TTC</span>
            <div style={{ textAlign: 'right' }}>
              {remiseDeadline && (
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                  {totalBrut.toLocaleString('fr-FR')} €
                </div>
              )}
              <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)', fontSize: 22 }}>
                {totalNet.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          {isHorsZone && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#f97316', fontSize: 12, lineHeight: 1.6 }}>
              ⚠ Hors frais de déplacement ({km} km · distance hors zone) — à déterminer par votre conseiller
            </div>
          )}
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

        <div className="submit-cta-bar">
          {qontoError && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 12, marginBottom: 8 }}>⚠ {qontoError}</p>}
          <BtnPrimary onClick={submitDevisParticulier} disabled={qontoLoading} className="submit-devis-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {qontoLoading ? '⏳ Envoi en cours…' : isHorsZone ? '📩 Recevoir mon devis sur-mesure' : '📩 Obtenir mon devis par e-mail'}
          </BtnPrimary>
          <p style={{ textAlign: 'center', color: 'rgba(184,239,11,0.55)', fontSize: 12, marginTop: 10 }}>
            Gratuit et sans engagement
          </p>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     ÉTAPES PROFESSIONNEL
  ══════════════════════════════════════════════════════════════════ */

  /* Segmentation — nature du besoin */
  const renderStep9 = () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      <button onClick={goBack} className="hide-desktop" style={{
        position: 'absolute', top: 16, left: 16,
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: 0,
        fontSize: 13, fontFamily: 'var(--font-display), sans-serif', fontWeight: 500,
      }}>← Retour</button>
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        <AnimatedWave bars={36} height={60} style={{ maxWidth: 480, margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, marginBottom: 8 }}>
          Quel est votre besoin ?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, marginBottom: 36, lineHeight: 1.7 }}>
          Pour vous orienter vers le bon parcours.
        </p>
        <div className="gate-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ProfileCard icon="🔊" title="Une prestation ciblée"
            sub={"Sonorisation, éclairage, DJ,\nkaraoké… pour un événement déjà cadré"} badge="Devis en ligne immédiat"
            onClick={() => { setProBesoin('cible'); goStep(19); }} />
          <ProfileCard icon="🎪" title="Un événement à organiser"
            sub={"Séminaire, gala, convention…\nplusieurs prestations à coordonner"} badge="Accompagnement conseiller"
            onClick={() => { setProBesoin('evenement'); goStep(10); }} />
        </div>
      </div>
    </div>
  );

  /* ── Prestation ciblée — vos informations ──────────────────────── */
  const renderStep19 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={1} total={3} />
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos informations
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12 }}>Étape 1 sur 3 · Identité, événement et lieu</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
        Les champs marqués <span style={{ color: '#ef4444' }}>*</span> sont obligatoires pour continuer.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Identité */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
            👤 Identité <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Prénom *" value={ciblePrenom} onChange={e => setCiblePrenom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            <input placeholder="Nom *" value={cibleNom} onChange={e => setCibleNom(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <input type="tel" placeholder="Téléphone *" value={cibleTel} onChange={e => setCibleTel(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
              {cibleTel.trim() && !/^[0-9+\s().-]{6,}$/.test(cibleTel) && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ Numéro invalide — chiffres uniquement</p>
              )}
            </div>
            <div>
              <input type="email" placeholder="Email professionnel *" value={cibleEmail} onChange={e => setCibleEmail(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
              {cibleEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cibleEmail) && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ Format attendu : nom@domaine.fr</p>
              )}
            </div>
          </div>
        </div>

        {/* Événement */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
            📅 Votre événement <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginBottom: 14 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Type d'événement</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Séminaire', 'Gala / Soirée de prestige', 'Lancement produit', 'Soirée d\'entreprise', 'Conférence', 'Autre'].map(t => (
                  <button key={t} onClick={() => setCibleEventType(t)} style={{
                    padding: '8px 16px', borderRadius: 7,
                    border: `1px solid ${cibleEventType === t ? 'var(--lime)' : 'rgba(255,255,255,0.12)'}`,
                    background: cibleEventType === t ? 'rgba(184,239,11,0.1)' : 'transparent',
                    color: cibleEventType === t ? 'var(--lime)' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-display), sans-serif', fontWeight: cibleEventType === t ? 700 : 500, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Date de l'événement <span style={{ color: '#ef4444' }}>*</span></div>
              <MiniCal selected={cibleDate} onSelect={setCibleDate} devisPending={pendingDates} bookedDates={bookedDates} yearsAhead={2} loading={availabilityLoading} />
              {cibleDate && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif' }}>
                  ✓ {new Date(cibleDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              {cibleDate && (pendingDates[cibleDate] ?? 0) > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 8, fontSize: 12, color: '#f97316', lineHeight: 1.6 }}>
                  ⚠️ <strong>{pendingDates[cibleDate]} devis déjà demandé{pendingDates[cibleDate] > 1 ? 's' : ''}</strong> pour cette date — pour être prioritaire, répondez rapidement à l'appel de notre conseiller afin de finaliser et signer votre devis au plus vite.
                </div>
              )}
              {!cibleDate && (
                <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginTop: 8 }}>
                  ⚠ Sélectionnez une date pour continuer
                </p>
              )}
            </div>
          </div>
          <textarea placeholder="Précisions sur votre événement (facultatif)…"
            value={cibleDesc} onChange={e => setCibleDesc(e.target.value)} rows={3}
            style={{ ...IS, resize: 'vertical', lineHeight: 1.65 }}
            onFocus={fo} onBlur={bl} />
        </div>

        {/* Lieu */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
            📍 Lieu de l'événement <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: cibleKm ? 12 : 0 }}>
            <AddressAutocomplete placeholder="Adresse complète de la salle / lieu *"
              value={cibleLieu}
              onChange={v => { setCibleLieu(v); setCibleLieuCoords(null); setCibleKm(null); }}
              onSelect={s => { setCibleLieu(s.label); setCibleLieuCoords(s.coords); }}
              onEnter={e => e.key === 'Enter' && estimateCibleKm()} />
            <button onClick={estimateCibleKm} disabled={!cibleLieu.trim() || cibleKmLoading}
              style={{
                padding: '12px 18px', borderRadius: 8, border: 'none',
                cursor: cibleLieu.trim() && !cibleKmLoading ? 'pointer' : 'default',
                background: cibleLieu.trim() ? 'var(--lime)' : 'rgba(255,255,255,0.06)',
                color: cibleLieu.trim() ? '#0d1b2a' : 'rgba(255,255,255,0.22)',
                fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              }}>
              {cibleKmLoading ? '⌛ Calcul…' : '📍 Estimer le trajet'}
            </button>
          </div>
          {cibleKm && getTransportFee(cibleKm) === null && (
            <div style={{
              padding: '12px 14px', background: 'rgba(249,115,22,0.07)',
              border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, fontSize: 13,
            }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', marginBottom: 2 }}>Distance estimée</span>
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: '#f97316' }}>{cibleKm} km</span>
              </div>
              <div style={{ color: '#f97316', fontSize: 12, lineHeight: 1.6 }}>
                Distance supérieure à 600 km — hors de notre simulateur en ligne. Contactez-nous pour un devis sur mesure.
              </div>
            </div>
          )}
          {cibleKm && getTransportFee(cibleKm) !== null && (
            <div style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '12px 14px', background: 'rgba(184,239,11,0.06)',
              border: '1px solid rgba(184,239,11,0.18)', borderRadius: 8, fontSize: 13,
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', marginBottom: 2 }}>Distance estimée</span>
                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: 'var(--lime)' }}>{cibleKm} km</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, alignSelf: 'flex-end', paddingBottom: 1 }}>
                Aller-retour depuis Nort-sur-Erdre
              </div>
            </div>
          )}
          {cibleLieu.trim() && !cibleKm && !cibleKmLoading && (
            <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginTop: 10 }}>
              ⚠ Cliquez sur "Estimer le trajet" pour valider l'adresse avant de continuer
            </p>
          )}
          {!cibleLieu.trim() && (
            <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginTop: 10 }}>
              ⚠ Renseignez le lieu de votre événement pour continuer
            </p>
          )}
        </div>

        <BtnPrimary onClick={() => goStep(20)}
          disabled={!ciblePrenom || !cibleNom || !cibleTel || !cibleEmail || !cibleDate || !cibleKm
            || !/^[0-9+\s().-]{6,}$/.test(cibleTel) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cibleEmail)}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  /* ── Prestation ciblée — configurateur (tarifs HT) ──────────────── */
  const renderStep20 = () => (
    <div style={{ flex: 1, padding: '28px 24px 130px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={2} total={3} />
      <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
        Vos prestations
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Étape 2 sur 3 · Sélectionnez ce dont vous avez besoin — tarifs HT</p>

      {/* Détail par catégorie — flottant en haut à droite */}
      {(() => {
        const cibleLines = [
          cibleDjActive               && ['DJ / Animation', cibleDjPrice],
          cibleSonoActive             && ['Sonorisation', cibleSonPrice],
          cibleMicroPrice > 0         && [`Micros (${cibleMicroQty})`, cibleMicroPrice],
          cibleEclairActive           && ['Éclairage', cibleEclairPrice],
          cibleKaraokeActive          && ['Karaoké', cibleKaraokePrice],
          cibleVideoChoice !== 'none' && ['Vidéo & Écrans', cibleVideoPrice],
          cibleInstallPrice > 0       && ['Installation', cibleInstallPrice],
          cibleKmFee > 0              && ['Déplacement', cibleKmFee],
        ].filter(Boolean);
        return (
          <>
            <BreakdownPanel lines={cibleLines} total={cibleTotalHT} totalLabel="TOTAL HT" unit="€ HT" />
            <DetailModal    lines={cibleLines} total={cibleTotalHT} totalLabel="TOTAL HT" unit="€ HT" />
          </>
        );
      })()}

      {/* DJ */}
      <PackBlock title="🎧 DJ / Animation" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        <YesNoRow label="Avez-vous besoin d'un DJ ?"
          value={cibleDjActive}
          onChange={setCibleDjActive}
        />
        {cibleDjActive && (
          <div style={{ padding: '14px 18px', background: 'rgba(184,239,11,0.04)' }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 10 }}>
              ⏱ Durée — minimum <span style={{ color: 'var(--lime)' }}>{DJ_PRO_CFG.minDur}h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setCibleDjDuration(d => Math.max(DJ_PRO_CFG.minDur, d - 1))}
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>−</button>
                <div style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--lime)' }}>{cibleDjDuration}h</div>
                <button onClick={() => setCibleDjDuration(d => d + 1)}
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>+</button>
              </div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>Forfait : </span>
                <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{DJ_PRO_CFG.forfait} € HT</span>
                {cibleDjXtraHours > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {' '}+ {cibleDjXtraHours}h compl. · <span style={{ color: 'var(--lime)', fontWeight: 700 }}>+{cibleDjXtraHours * DJ_PRO_CFG.xph} €</span> ({DJ_PRO_CFG.xph} €/h)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </PackBlock>

      {/* Sonorisation */}
      <PackBlock title="🔊 Sonorisation" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        <YesNoRow label="Avez-vous besoin de sonorisation ?"
          value={cibleSonoActive}
          onChange={setCibleSonoActive}
        />
        {cibleSonoActive && (
          <div style={{ padding: '14px 18px', background: 'rgba(184,239,11,0.04)' }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 10 }}>
              👥 Effectif estimé <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <input type="number" min={1} placeholder="Nombre de personnes *"
                value={cibleNbPersons} onChange={e => setCibleNbPersons(e.target.value)}
                style={{ ...IS, width: 140, textAlign: 'center', fontSize: 17, fontWeight: 700 }}
                onFocus={fo} onBlur={bl} />
              {cibleSon && (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>Pack adapté : </span>
                  <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{cibleSon.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}> · </span>
                  <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{cibleSon.price} € HT</span>
                </div>
              )}
            </div>
            {!cibleNb && (
              <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.85)', marginTop: 10 }}>
                ⚠ Indiquez le nombre de personnes pour estimer le pack adapté
              </p>
            )}

            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, margin: '16px 0 10px' }}>
              🎤 Micros — {MICRO_PRICE} € HT / micro
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setCibleMicroQty(q => Math.max(0, q - 1))}
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>−</button>
                <div style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--lime)' }}>{cibleMicroQty}</div>
                <button onClick={() => setCibleMicroQty(q => Math.min(6, q + 1))}
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}>+</button>
              </div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>Maximum 6 micros</span>
                {cibleMicroQty > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {' '}· <span style={{ color: 'var(--lime)', fontWeight: 700 }}>+{cibleMicroPrice} € HT</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </PackBlock>

      {/* Éclairage */}
      <PackBlock title="💡 Éclairage" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        <YesNoRow label="Avez-vous besoin d'éclairage ?"
          value={cibleEclairActive}
          onChange={setCibleEclairActive}
        />
        {cibleEclairActive && (
          <>
            <ToggleRow label="Mise en lumière de la salle"
              price={ECLAIR_ARCHI_PRICE} note="Option" unit="€ HT"
              checked={cibleEclairSalle}
              onChange={() => setCibleEclairSalle(v => !v)}
            />
            {cibleDjActive && (
              <ToggleRow label="Mise en lumière de la piste de danse"
                price={ECLAIR_ARCHI_PRICE} note="Option" unit="€ HT"
                checked={cibleEclairArchi}
                onChange={() => setCibleEclairArchi(v => !v)}
              />
            )}
          </>
        )}
      </PackBlock>

      {/* Karaoké */}
      <PackBlock title="🎤 Karaoké" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        <YesNoRow label="Avez-vous besoin d'un karaoké ?"
          value={cibleKaraokeActive}
          onChange={(v) => {
            setCibleKaraokeActive(v);
            if (v) {
              setCibleVideoNeeded(true); setCibleVideoChoice('fourni');
            } else if (cibleVideoChoice === 'fourni') {
              setCibleVideoNeeded(null); setCibleVideoChoice('none');
            }
          }}
        />
        {cibleKaraokeActive && (
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)' }}>
              Système karaoké
            </div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
              +{KARAOKE_PRICE} € HT
            </div>
          </div>
        )}
      </PackBlock>

      {/* Vidéo */}
      <PackBlock title="🎬 Vidéo & Écrans" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.22)">
        {cibleKaraokeActive ? (
          <div style={{ padding: '14px 18px 6px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            Un écran est nécessaire pour afficher les paroles du karaoké — « {CIBLE_VIDEO_OPTS.find(o => o.id === 'fourni')?.label} » est sélectionné par défaut, mais vous pouvez choisir une autre option ci-dessous.
          </div>
        ) : (
          <YesNoRow label="Avez-vous besoin d'un écran ou d'un système vidéo ?"
            value={cibleVideoNeeded}
            onChange={(v) => {
              setCibleVideoNeeded(v);
              setCibleVideoChoice(v ? VIDEO_OPTS[1].id : 'none');
            }}
          />
        )}
        {(cibleKaraokeActive || cibleVideoNeeded) && (cibleKaraokeActive ? CIBLE_VIDEO_OPTS : VIDEO_OPTS).filter(o => o.id !== 'none').map(o => (
          <RadioRow key={o.id} label={o.label} price={o.price} unit="€ HT"
            selected={cibleVideoChoice === o.id}
            onSelect={() => setCibleVideoChoice(o.id)}
          />
        ))}
      </PackBlock>

      {/* Installation — incluse dès qu'une prestation est sélectionnée (hors DJ seul) */}
      {cibleAnyEquip && !cibleOnlyDj && (
        <PackBlock title="🔧 Installation & désinstallation" badge="INCLUS" badgeColor="rgba(255,255,255,0.22)">
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                ✓ Montage et démontage du matériel sur place
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                Inclus dès qu'au moins une prestation est sélectionnée
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
              {INSTALL_PRICE} € HT
            </div>
          </div>
        </PackBlock>
      )}

      {/* Frais de déplacement — affichés dès qu'au moins une prestation est sélectionnée et qu'un trajet a été estimé à l'étape 1 */}
      {cibleAnyEquip && cibleKmFee > 0 && (
        <PackBlock title="🚗 Frais de déplacement" badge="INCLUS" badgeColor="rgba(255,255,255,0.22)">
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--lime)', marginBottom: 3 }}>
                ✓ Trajet jusqu'au lieu de votre événement
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                {cibleKm} km estimés — déjà inclus dans le tarif affiché ci-dessous
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>
              {cibleKmFee} € HT
            </div>
          </div>
        </PackBlock>
      )}

      {cibleAnyEquip && cibleKm && getTransportFee(cibleKm) === null && (
        <PackBlock title="🚗 Frais de déplacement" badge="À DÉTERMINER" badgeColor="#f97316">
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: '#f97316', marginBottom: 3 }}>
              ⚠ Distance hors zone ({cibleKm} km)
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Non inclus dans le total ci-dessous — un conseiller vous proposera un tarif sur mesure.
            </div>
          </div>
        </PackBlock>
      )}

      {/* Barre totale fixe */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,14,22,0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(184,239,11,0.25)', padding: '13px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            Total estimé HT {cibleKm && getTransportFee(cibleKm) === null && '· hors frais de déplacement'}
          </div>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 'clamp(18px,3vw,28px)', color: 'var(--lime)' }}>
            <AnimatedPrice value={cibleTotalHT} /> €
          </div>
          <DetailToggle />
        </div>
        <BtnPrimary onClick={() => goStep(21)} disabled={!cibleAnyEquip || (cibleSonoActive && !cibleNb)}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  const renderStep21 = () => {
    const cibleIsHorsZone = cibleKm && getTransportFee(cibleKm) === null;

    if (sent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <AnimatedWave bars={32} height={56} style={{ maxWidth: 380, margin: '0 auto 24px' }} />
          <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, marginBottom: 10 }}>
            {cibleIsHorsZone ? 'Votre demande a bien été reçue !' : 'Votre devis a été envoyé !'}
          </h2>
          {cibleIsHorsZone ? (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>
                Votre événement se situe au-delà de notre zone de déplacement standard (600 km).
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                Un conseiller vous recontacte sous 24 à 48h avec un devis sur mesure incluant les frais de déplacement.
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>
                Votre devis (à titre indicatif) de <strong style={{ color: 'var(--lime)' }}>{cibleTotalHT.toLocaleString('fr-FR')} € HT</strong> a été envoyé à <strong style={{ color: 'white' }}>{cibleEmail}</strong> — consultez-le dès maintenant.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                Prochaine étape : un conseiller vous appelle sous 24h. Le devis sera ensuite finalisé et envoyé pour signature électronique. Le paiement de l'acompte (60 %) validera définitivement votre date.
              </p>
            </>
          )}
          <a href="https://myracoustic.com" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', display: 'inline-block',
          }}>Retour à l'accueil</a>
        </div>
      </div>
    );

    return (
      <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <MobileStepBar current={3} total={3} />
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, marginBottom: 4 }}>
          Entreprise à facturer
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Étape 3 sur 3 · Informations de l'entreprise qui règle la facture</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Récap informations déjà saisies */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              ['Contact',     `${ciblePrenom} ${cibleNom} · ${cibleTel}`],
              ['Email',       cibleEmail],
              ['Événement',   `${cibleEventType ? cibleEventType + ' · ' : ''}${cibleDate ? new Date(cibleDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`],
              cibleLieu && ['Lieu', cibleKm ? `${cibleLieu} · ${cibleKm} km · ${getTransportFee(cibleKm) === null ? 'à déterminer (hors zone)' : `forfait ${cibleKmFee} €`}` : cibleLieu],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.38)' }}>{k}</span>
                <span style={{ color: 'rgba(255,255,255,0.82)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Entreprise */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
              🏢 Entreprise <span style={{ color: '#ef4444' }}>*</span>
            </div>

            {entSelected ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', background: 'rgba(184,239,11,0.06)',
                border: '1px solid rgba(184,239,11,0.18)', borderRadius: 8,
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--lime)', marginBottom: 4 }}>
                    ✓ {entSelected.nom}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
                    SIRET {entSelected.siret || '—'}{entSelected.forme && ` · ${entSelected.forme}`}<br />
                    {entSelected.adresse && <>{entSelected.adresse}<br /></>}
                    {(entSelected.cp || entSelected.ville) && `${entSelected.cp} ${entSelected.ville}`}
                  </div>
                </div>
                <button onClick={() => { setEntSelected(null); setCibleSociete(''); setCibleSiret(''); setEntResults([]); setEntSearch(''); }}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7,
                    padding: '7px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  Changer
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <input placeholder="Nom de l'entreprise ou n° SIRET"
                    value={entSearch} onChange={e => setEntSearch(e.target.value)}
                    onFocus={fo} onBlur={bl} style={{ ...IS, flex: '1 1 220px' }}
                    onKeyDown={e => e.key === 'Enter' && searchEntreprise()} />
                  <button onClick={searchEntreprise} disabled={!entSearch.trim() || entLoading}
                    style={{
                      padding: '12px 18px', borderRadius: 8, border: 'none',
                      cursor: entSearch.trim() && !entLoading ? 'pointer' : 'default',
                      background: entSearch.trim() ? 'var(--lime)' : 'rgba(255,255,255,0.06)',
                      color: entSearch.trim() ? '#0d1b2a' : 'rgba(255,255,255,0.22)',
                      fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                    }}>
                    {entLoading ? '⌛ Recherche…' : '🔍 Rechercher'}
                  </button>
                </div>

                {entErr && <p style={{ fontSize: 12, color: '#f97316', marginBottom: 12 }}>⚠ {entErr}</p>}

                {entResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {entResults.map(r => (
                      <button key={r.siret || r.siren} onClick={() => validateEntreprise(r)}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                        }}>
                        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                          {r.nom}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          SIRET {r.siret || '—'}{r.adresse && ` · ${r.adresse}`}{(r.cp || r.ville) && ` · ${r.cp} ${r.ville}`}
                        </div>
                      </button>
                    ))}
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      Cliquez sur votre entreprise pour valider ses informations de facturation.
                    </p>
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>
                  Vous ne trouvez pas votre entreprise ? Saisissez ses informations manuellement :
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input placeholder="Société / Raison sociale *" value={cibleSociete} onChange={e => setCibleSociete(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
                  <input placeholder="Numéro de SIRET *" value={cibleSiret} onChange={e => setCibleSiret(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
                </div>
              </>
            )}
          </div>

          <div style={{
            background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.18)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Estimation de votre devis {cibleIsHorsZone && '(hors déplacement)'}</span>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--lime)' }}>{cibleTotalHT.toLocaleString('fr-FR')} € HT</span>
          </div>

          {cibleIsHorsZone && (
            <p style={{ fontSize: 12, color: '#f97316', lineHeight: 1.6, textAlign: 'center' }}>
              ⚠ Hors frais de déplacement ({cibleKm} km · distance hors zone) — à déterminer par votre conseiller
            </p>
          )}

          {!cibleIsHorsZone && cibleTotalHT > 0 && (() => {
            const a = Math.round(cibleTotalHT * 0.6);
            return (
              <div style={{ background: 'rgba(52,55,144,0.12)', border: '1px solid rgba(52,55,144,0.35)', borderRadius: 12, padding: '18px 20px', marginTop: 8 }}>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                  💳 Conditions de paiement
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid var(--lime)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Acompte à la signature</div>
                    <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 26, color: 'white', lineHeight: 1 }}>{a.toLocaleString('fr-FR')} € HT</div>
                    <div style={{ color: 'var(--lime)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>60 %</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid rgba(52,55,144,0.8)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Solde le jour J</div>
                    <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 26, color: 'white', lineHeight: 1 }}>{(cibleTotalHT - a).toLocaleString('fr-FR')} € HT</div>
                    <div style={{ color: 'rgba(184,239,11,0.6)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>40 %</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <BtnPrimary onClick={submitDevisPro}
            disabled={!cibleSociete || !cibleSiret || qontoLoading}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {qontoLoading ? '⏳ Envoi en cours…' : cibleIsHorsZone ? '📩 Recevoir mon devis sur-mesure' : '✉️ Recevoir mon devis →'}
          </BtnPrimary>
          {qontoError && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠ {qontoError}</p>}
        </div>
      </div>
    );
  };

  const renderStep10 = () => (
    <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <MobileStepBar current={1} total={2} />
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
          <div>
            <input type="email" placeholder="Email professionnel *" value={proEmail} onChange={e => setProEmail(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            {proEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(proEmail) && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ Format attendu : nom@domaine.fr</p>
            )}
          </div>
          <div>
            <input type="tel" placeholder="Téléphone *" value={proTel} onChange={e => setProTel(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
            {proTel.trim() && !/^[0-9+\s().-]{6,}$/.test(proTel) && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ Numéro invalide — chiffres uniquement</p>
            )}
          </div>
        </div>
        <input placeholder="Poste / Fonction" value={proPoste} onChange={e => setProPoste(e.target.value)} style={IS} onFocus={fo} onBlur={bl} />
        <BtnPrimary onClick={() => goStep(11)}
          disabled={!proPrenom || !proNom || !proSociete || !proEmail || !proTel
            || !/^[0-9+\s().-]{6,}$/.test(proTel) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(proEmail)}
          style={{ marginTop: 8 }}>
          Continuer →
        </BtnPrimary>
      </div>
    </div>
  );

  const renderStep11 = () => {
    if (sent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <AnimatedWave bars={32} height={56} style={{ maxWidth: 380, margin: '0 auto 24px' }} />
          <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, marginBottom: 10 }}>
            Demande reçue !
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            Notre équipe vous contactera sous 24h à <strong style={{ color: 'white' }}>{proEmail}</strong> pour planifier votre rendez-vous.
          </p>
          <a href="https://myracoustic.com" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display), sans-serif', display: 'inline-block',
          }}>Retour à l'accueil</a>
        </div>
      </div>
    );

    return (
      <div style={{ flex: 1, padding: '28px 24px 60px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <MobileStepBar current={2} total={2} />
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
          <BtnPrimary onClick={submitContactPro} disabled={!proType || !proPersonnes || qontoLoading} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {qontoLoading ? '⏳ Envoi en cours…' : '📨 Envoyer ma demande de contact →'}
          </BtnPrimary>
          {qontoError && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠ {qontoError}</p>}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>
            Notre équipe vous recontacte sous 24h ouvrées
          </p>
        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="devis-outer" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', paddingTop: 70 }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 768px) {
          .devis-tunnel-header { display: none !important; }
          .devis-outer { padding-top: 122px !important; }
          .gate-profile-grid { grid-template-columns: 1fr !important; }
          .step4-container { padding-bottom: 100px !important; }
          .submit-cta-bar {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
            background: rgba(6,14,22,0.97); backdrop-filter: blur(16px);
            border-top: 1px solid rgba(184,239,11,0.25);
            padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
            box-shadow: 0 -4px 20px rgba(0,0,0,0.35);
          }
          .submit-devis-btn { width: 100% !important; }
        }
        @media (max-width: 1180px) {
          .detail-breakdown { display: none !important; }
          .detail-toggle-btn { display: inline-block !important; }
        }
      `}</style>
      <Header />
      {step === -1                           && renderGate()}
      {profil === 'particulier' && step === 0 && renderStep0()}
      {profil === 'particulier' && step === 1 && renderStep1()}
      {profil === 'particulier' && step === 2 && renderStep2()}
      {profil === 'particulier' && step === 3 && renderStep3()}
      {profil === 'particulier' && step === 4 && renderStep4()}
      {profil === 'particulier' && step === 5 && renderStep5()}
      {profil === 'professionnel' && step === 9  && renderStep9()}
      {profil === 'professionnel' && step === 10 && renderStep10()}
      {profil === 'professionnel' && step === 11 && renderStep11()}
      {profil === 'professionnel' && step === 19 && renderStep19()}
      {profil === 'professionnel' && step === 20 && renderStep20()}
      {profil === 'professionnel' && step === 21 && renderStep21()}
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

function ToggleRow({ label, price, checked, onChange, note, unit = '€' }) {
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
          {price} {unit}
        </div>
      )}
    </div>
  );
}

function RadioRow({ label, note, price, selected, onSelect, unit = '€' }) {
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
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: selected ? 'var(--lime)' : 'white' }}>
          {label}
        </div>
        {note && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{note}</div>}
      </div>
      <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: selected ? 'var(--lime)' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
        {price > 0 ? `${price} ${unit}` : ''}
      </div>
    </div>
  );
}

function YesNoRow({ label, note, value, onChange }) {
  const btnStyle = (active) => ({
    minWidth: 64, padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13,
    border: `1px solid ${active ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
    background: active ? 'var(--lime)' : 'transparent',
    color: active ? '#0d1b2a' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.15s',
  });
  return (
    <div style={{
      padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: 'white' }}>{label}</span>
        {note && <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{note}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onChange(true)} style={btnStyle(value === true)}>Oui</button>
        <button onClick={() => onChange(false)} style={btnStyle(value === false)}>Non</button>
      </div>
    </div>
  );
}
