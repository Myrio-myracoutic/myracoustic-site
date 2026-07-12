'use client';
import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Loader2, MapPin, Plus, Minus, SlidersHorizontal, CreditCard, Phone } from 'lucide-react';
import { FORMULES, POLES, fmtPrice, EXTRA_HOUR_PRICE } from '../lib/formules';
import { gtagEvent, gtagBeacon } from '../lib/gtag';
import AddressAutocomplete from './AddressAutocomplete';
import MiniCal from './MiniCal';

const STEP_NAMES = { 1: 'coordonnees', 2: 'evenement', 3: 'options' };

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 };
const stepBtn = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function inclusionsText(f) {
  return ['dj', 'son', 'lumiere', 'video', 'ceremonie', 'jourJ']
    .map(k => f.specs[k]).filter(Boolean)
    .map(s => `• ${s}`).join('\n');
}

/* Bloc + ligne à cocher — même style que le tunnel devis */
function PackBlock({ icon: Icon, title, badge, badgeColor, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)' }}>
        {Icon && <span style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}><Icon size={15} strokeWidth={1.5} /></span>}
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15 }}>{title}</span>
        {badge && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: `${badgeColor}22`, color: badgeColor, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, price, checked, onChange, note, locked }) {
  return (
    <div onClick={locked ? undefined : onChange} style={{
      padding: '14px 18px', cursor: locked ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 14,
      background: checked ? 'rgba(184,239,11,0.06)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.18s',
      opacity: locked && !checked ? 0.55 : 1,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${checked ? 'var(--lime)' : 'rgba(255,255,255,0.2)'}`, background: checked ? 'var(--lime)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d1b2a' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14, color: checked ? 'var(--lime)' : 'white' }}>{label}</span>
        {note && <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{note}</span>}
      </div>
      {price != null && <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14, color: checked ? 'var(--lime)' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>+{price.toLocaleString('fr-FR')} €</div>}
    </div>
  );
}

function Header() {
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, background: 'rgba(6,14,22,0.95)', backdropFilter: 'blur(12px)', zIndex: 50,
    }}>
      <Link href="/mariage" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Retour aux formules
      </Link>
      <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} />
    </div>
  );
}

const STEPS = [[1, 'Coordonnées'], [2, 'Événement'], [3, 'Options']];

function Progress({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
      {STEPS.map(([n, lab], i) => {
        const reached = step >= n, doneStep = step > n;
        return (
          <Fragment key={n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: reached ? 1 : 0.4 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: reached ? 'var(--lime)' : 'transparent', color: reached ? '#0d1b2a' : 'rgba(255,255,255,0.6)',
                border: `1.5px solid ${reached ? 'var(--lime)' : 'rgba(255,255,255,0.25)'}`,
                fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display), sans-serif',
              }}>{doneStep ? <Check size={13} strokeWidth={3} /> : n}</span>
              <span className="hide-mobile" style={{ fontSize: 12.5, fontWeight: 600, color: reached ? '#fff' : 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-display), sans-serif' }}>{lab}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: step > n ? 'var(--lime)' : 'rgba(255,255,255,0.12)' }} />}
          </Fragment>
        );
      })}
    </div>
  );
}

function Configurator({ formule, onSwitch }) {
  const [step, setStep]     = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [date, setDate]     = useState('');
  const [lieu, setLieu]     = useState('');
  const [guests, setGuests] = useState('');
  const [adresse, setAdresse] = useState('');
  const [cp, setCp]         = useState('');
  const [ville, setVille]   = useState('');
  const [sel, setSel]       = useState({});
  const [extraHours, setExtraHours] = useState(0);
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(null);
  const [error, setError]   = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const optionsRef = useRef(null);
  const [bookedDates, setBookedDates] = useState(new Set());
  const [availLoading, setAvailLoading] = useState(true);

  const allowExtra = formule.key !== 'prestige';
  const hasReception = formule.options.some(o => o.key === 'reception');
  /* Heures DJ comprises dans la formule ('6h' → 6) — Prestige : soirée complète, pas de compteur */
  const baseHours = parseInt(formule.specs.dj, 10) || 0;

  /* ── Suivi GA4 du tunnel ────────────────────────────────────────── */
  const stepStartRef = useRef(Date.now());

  useEffect(() => {
    stepStartRef.current = Date.now();
    gtagEvent('funnel_step', { profil: 'mariage', formule: formule.key, step, step_name: STEP_NAMES[step] ?? `step_${step}` });
  }, [step, formule.key]);

  useEffect(() => {
    const fireAbandon = () => {
      if (done) return;
      gtagBeacon('funnel_abandon', {
        profil: 'mariage', formule: formule.key, step,
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
  }, [step, done, formule.key]);

  useEffect(() => {
    const t = new Date();
    const start = t.toISOString().slice(0, 10);
    const end = new Date(t.getFullYear() + 2, t.getMonth(), t.getDate()).toISOString().slice(0, 10);
    fetch(`/api/availability?start=${start}&end=${end}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.bookedDates) setBookedDates(new Set(d.bookedDates)); })
      .catch(() => {})
      .finally(() => setAvailLoading(false));
  }, []);

  // Grande réception : pilotée par le nombre d'invités — obligatoire et verrouillée dès 150
  useEffect(() => {
    if (!hasReception) return;
    const n = parseInt(guests);
    const want = !isNaN(n) && n >= 150;
    setSel(s => (!!s.reception === want ? s : { ...s, reception: want }));
  }, [guests, hasReception]);

  const toggle = (key) => {
    if (key === 'reception') return; // géré automatiquement par le nombre d'invités
    setSel(s => {
      const next = { ...s, [key]: !s[key] };
      if (key === 'murled2' && next.murled2) next.murled4 = false;
      if (key === 'murled4' && next.murled4) next.murled2 = false;
      return next;
    });
  };

  const chosen = formule.options.filter(o => sel[o.key]);
  const optionsTotal = useMemo(() => chosen.reduce((s, o) => s + o.price, 0), [chosen]);
  const extraCost = allowExtra ? extraHours * EXTRA_HOUR_PRICE : 0;
  const total = formule.price + optionsTotal + extraCost;
  const acompte60 = Math.round(total * 0.6);
  const solde40 = total - acompte60;

  const step1Valid = firstName.trim() && lastName.trim() && /\S+@\S+\.\S+/.test(email) && phone.trim();
  const step2Valid = date && lieu.trim();
  /* Adresse de facturation : exigée par Qonto pour créer le devis */
  const step3Valid = adresse.trim() && cp.trim() && ville.trim();

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const next = () => {
    if (step === 1 && !step1Valid) {
      gtagEvent('funnel_error', { step, step_name: STEP_NAMES[1], error_type: 'coordonnees_incompletes' });
      return;
    }
    if (step === 2 && !step2Valid) {
      gtagEvent('funnel_error', { step, step_name: STEP_NAMES[2], error_type: 'date_ou_lieu_manquant' });
      return;
    }
    setStep(s => Math.min(3, s + 1)); goTop();
  };
  const back = () => { setStep(s => Math.max(1, s - 1)); goTop(); };

  const submit = async () => {
    if (sending) return;
    if (!step3Valid) {
      gtagEvent('funnel_error', { step, step_name: STEP_NAMES[3], error_type: 'adresse_incomplete' });
      setError('Merci de renseigner votre adresse de facturation.');
      return;
    }
    setSending(true); setError('');
    const items = [
      { title: `Formule ${formule.name} — Mariage`, description: inclusionsText(formule), priceHT: formule.price / 1.2 },
      ...chosen.map(o => ({ title: o.label, description: '', priceHT: o.price / 1.2 })),
    ];
    if (extraCost > 0) items.push({ title: `Heures DJ supplémentaires (${extraHours}h)`, description: `${EXTRA_HOUR_PRICE} €/h — soit ${baseHours + extraHours}h de prestation DJ au total`, priceHT: extraCost / 1.2 });
    try {
      const res = await fetch('/api/qonto/devis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { type: 'individual', firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim() },
          event: { type: 'Mariage', date, lieu: lieu.trim(), formule: formule.key },
          items,
          note: `Formule ${formule.name}${guests ? ` · ${guests} invités` : ''} · personnalisé en ligne · déplacement à confirmer selon le lieu`,
        }),
      });
      const data = await res.json();
      setSending(false);
      if (!res.ok) {
        setError('Un problème technique nous empêche de générer votre devis en ligne. Réessayez dans quelques minutes, ou appelez-nous au 07 68 53 33 08 — un conseiller établira votre devis avec vous.');
        gtagEvent('funnel_error', { step, step_name: STEP_NAMES[step], error_type: 'soumission_echouee' });
        return;
      }
      gtagEvent('generate_lead', { profil: 'mariage', formule: formule.key, currency: 'EUR', value: total });
      setDone(data.quoteUrl || true);
    } catch {
      setSending(false);
      setError('La connexion a été interrompue. Vérifiez votre réseau et réessayez, ou appelez-nous au 07 68 53 33 08.');
      gtagEvent('funnel_error', { step, step_name: STEP_NAMES[step], error_type: 'erreur_reseau' });
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
        <Header />
        <div style={{ maxWidth: 460, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <CheckCircle2 size={52} color="#b8ef0b" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Votre devis est en route !</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Vous allez recevoir votre devis <strong style={{ color: '#fff' }}>Formule {formule.name}</strong> par email, et l'accès à votre <strong style={{ color: '#fff' }}>espace de mariage en ligne</strong>. <strong style={{ color: 'var(--lime)' }}>Un conseiller vous appellera sous 24h</strong> pour le finaliser avec vous. Première connexion à l'espace : utilisez l'email reçu.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mon-espace/connexion" className="btn-primary">Accéder à mon espace client</Link>
            {typeof done === 'string' && <a href={done} target="_blank" rel="noopener noreferrer" className="btn-secondary">Voir mon devis</a>}
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/mariage" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Retour à l'accueil mariage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <Header />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Votre formule · prix « à partir de »
        </div>
        {/* Sélecteur de formule — changer sans perdre ce qui est déjà saisi */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {FORMULES.map(f => {
            const active = f.key === formule.key;
            return (
              <button key={f.key} type="button"
                onClick={() => {
                  if (active) return;
                  gtagEvent('formule_switch', { profil: 'mariage', from: formule.key, to: f.key, step });
                  onSwitch(f.key);
                }}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10,
                  border: `1px solid ${active ? 'var(--lime)' : 'rgba(255,255,255,0.15)'}`,
                  background: active ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.04)',
                  color: active ? 'var(--lime)' : 'rgba(255,255,255,0.65)',
                  cursor: active ? 'default' : 'pointer',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13,
                }}>
                {f.name}
                <span style={{ display: 'block', fontSize: 11, fontWeight: 600, marginTop: 2, color: active ? 'rgba(184,239,11,0.75)' : 'rgba(255,255,255,0.4)' }}>{fmtPrice(f.price)}</span>
              </button>
            );
          })}
        </div>
        <Progress step={step} />

        <div style={{ marginTop: 28 }}>
          {/* ÉTAPE 1 — Coordonnées */}
          {step === 1 && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 18 }}>Vos coordonnées</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Prénom</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" style={input} /></div>
                <div><label style={label}>Nom</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" style={input} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={label}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" style={input} /></div>
              <div><label style={label}>Téléphone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={input} /></div>

              <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={next} disabled={!step1Valid} className="btn-primary" style={{ opacity: step1Valid ? 1 : 0.5, cursor: step1Valid ? 'pointer' : 'not-allowed' }}>Continuer <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {/* ÉTAPE 2 — Événement */}
          {step === 2 && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 18 }}>Votre événement</h1>
              <div style={{ marginBottom: 16 }}><label style={label}>Date du mariage</label><MiniCal selected={date} onSelect={setDate} bookedDates={bookedDates} loading={availLoading} yearsAhead={2} /></div>
              <div style={{ marginBottom: 16 }}><label style={label}>Lieu / commune</label><AddressAutocomplete value={lieu} onChange={setLieu} onSelect={(s) => setLieu(s.label)} placeholder="Commencez à taper l'adresse ou la commune…" inputStyle={input} /></div>
              <div><label style={label}>Nombre d'invités</label><input type="number" min={1} value={guests} onChange={e => setGuests(e.target.value)} placeholder="ex. 120" style={input} /></div>

              <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={back} className="btn-secondary"><ArrowLeft size={16} /> Retour</button>
                <button onClick={next} disabled={!step2Valid} className="btn-primary" style={{ opacity: step2Valid ? 1 : 0.5, cursor: step2Valid ? 'pointer' : 'not-allowed' }}>Continuer <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {/* ÉTAPE 3 — Options + confirmation */}
          {step === 3 && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Personnalisez votre formule</h1>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Voici ce que comprend déjà votre formule. Ajoutez des options (facultatif), puis confirmez pour recevoir votre devis.</p>

              {/* Rappel de ce que la formule comprend — les specs « En option » vivent dans la liste d'options */}
              <PackBlock icon={CheckCircle2} title={`Formule ${formule.name} — inclus`} badge="INCLUS" badgeColor="var(--lime)">
                {POLES.filter(p => formule.specs[p.key] && !/^en option/i.test(formule.specs[p.key])).map(p => (
                  <div key={p.key} style={{ padding: '11px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Check size={14} color="var(--lime)" strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                      <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, color: '#fff' }}>{p.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}> — {formule.specs[p.key]}</span>
                    </span>
                  </div>
                ))}
                {formule.platform && (
                  <div style={{ padding: '11px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Check size={14} color="var(--lime)" strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                      <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, color: '#fff' }}>Espace en ligne</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}> — {formule.platform}</span>
                    </span>
                  </div>
                )}
              </PackBlock>

              <div ref={optionsRef} />
              <PackBlock icon={SlidersHorizontal} title="Vos options" badge="OPTIONNEL" badgeColor="rgba(255,255,255,0.4)">
                {allowExtra && (
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 14 }}>Heures DJ supplémentaires</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>{EXTRA_HOUR_PRICE} €/h · {baseHours}h déjà incluses</div>
                      {extraHours > 0 && (
                        <div style={{ fontSize: 11.5, color: 'var(--lime)', fontWeight: 600, marginTop: 2 }}>
                          {baseHours}h + {extraHours}h = {baseHours + extraHours}h de prestation DJ
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setExtraHours(h => Math.max(0, h - 1))} style={stepBtn}><Minus size={15} /></button>
                      <span style={{ width: 24, textAlign: 'center', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' }}>{extraHours}</span>
                      <button onClick={() => setExtraHours(h => Math.min(6, h + 1))} style={stepBtn}><Plus size={15} /></button>
                    </div>
                  </div>
                )}
                {formule.options.map(o => {
                  const on = !!sel[o.key];
                  const locked = o.key === 'reception';
                  return (
                    <ToggleRow key={o.key} label={o.label} price={o.price} checked={on} locked={locked}
                      onChange={() => toggle(o.key)}
                      note={locked ? (on ? 'Obligatoire pour votre nombre d’invités' : 'Ajoutée automatiquement dès 150 invités') : ''} />
                  );
                })}
              </PackBlock>

              <PackBlock icon={MapPin} title="Adresse de facturation" badge="REQUIS" badgeColor="var(--lime)">
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AddressAutocomplete placeholder="Numéro et rue" value={adresse}
                    onChange={setAdresse}
                    onSelect={s => { setAdresse(s.street || s.label); if (s.postcode) setCp(s.postcode); if (s.city) setVille(s.city); }}
                    inputStyle={input} />
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
                    <input placeholder="Code postal" value={cp}
                      onChange={e => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      inputMode="numeric" maxLength={5} style={input} />
                    <input placeholder="Ville" value={ville} onChange={e => setVille(e.target.value)} style={input} />
                  </div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nécessaire pour établir votre devis.</p>
                </div>
              </PackBlock>

              {/* Récapitulatif */}
              <div style={{ marginTop: 22, background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Formule {formule.name}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{fmtPrice(formule.price)}</span>
                </div>
                {/* Rappel du contenu de la formule — la ligne DJ intègre les heures ajoutées */}
                <div style={{ padding: '0 0 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                  {POLES.filter(p => formule.specs[p.key] && !/^en option/i.test(formule.specs[p.key])).map(p => (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '2px 0', lineHeight: 1.5 }}>
                      <Check size={11} color="var(--lime)" strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span>{p.label} — {formule.specs[p.key]}</span>
                    </div>
                  ))}
                </div>
                {chosen.map(o => (
                  <div key={o.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '4px 0', color: 'rgba(255,255,255,0.6)' }}>
                    <span>+ {o.label}</span><span>{fmtPrice(o.price)}</span>
                  </div>
                ))}
                {extraCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '4px 0', color: 'rgba(255,255,255,0.6)' }}>
                    <span>+ Heures DJ supplémentaires ({extraHours}h)</span><span>{fmtPrice(extraCost)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total estimé</span>
                  <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{fmtPrice(total)}</span>
                </div>
              </div>

              {/* Conditions de paiement 60 / 40 */}
              <div style={{ background: 'rgba(52,55,144,0.12)', border: '1px solid rgba(52,55,144,0.35)', borderRadius: 12, padding: '18px 20px', marginTop: 14 }}>
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CreditCard size={13} strokeWidth={2} /> Conditions de paiement</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid var(--lime)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Acompte à la signature</div>
                    <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 24, color: 'white', lineHeight: 1 }}>{acompte60.toLocaleString('fr-FR')} €</div>
                    <div style={{ color: 'var(--lime)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>60 %</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 18px', borderLeft: '3px solid rgba(52,55,144,0.8)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Solde le jour J</div>
                    <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 24, color: 'white', lineHeight: 1 }}>{solde40.toLocaleString('fr-FR')} €</div>
                    <div style={{ color: 'rgba(184,239,11,0.6)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}>40 %</div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 14, lineHeight: 1.6 }}>
                Prix TTC. Le déplacement éventuel hors zone est confirmé selon votre lieu. La sonorisation est dimensionnée à votre nombre d'invités.
              </p>
              {error && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 10 }}>{error}</p>}

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
                <Phone size={13} color="var(--lime)" style={{ flexShrink: 0 }} />
                <span>Après envoi, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>un conseiller vous rappelle sous 24h</strong> pour finaliser votre devis.</span>
              </div>

              {!step3Valid && (
                <p style={{ fontSize: 12, color: 'rgba(249,115,22,0.85)', marginTop: 10 }}>
                  Adresse de facturation manquante : {[!adresse.trim() && 'numéro et rue', !cp.trim() && 'code postal', !ville.trim() && 'ville'].filter(Boolean).join(' · ')}
                </p>
              )}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={back} className="btn-secondary"><ArrowLeft size={16} /> Retour</button>
                <button onClick={() => (allowExtra ? setConfirmOpen(true) : submit())} disabled={sending || !step3Valid} className="btn-primary" style={{ opacity: sending || !step3Valid ? 0.5 : 1, cursor: sending || !step3Valid ? 'not-allowed' : 'pointer' }}>
                  {sending ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : 'Confirmer et recevoir mon devis →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modale de confirmation — vérification du volume d'heures avant l'envoi (portal : piège position fixed) */}
      {confirmOpen && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setConfirmOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
            padding: '28px 26px', maxWidth: 420, width: '100%', color: '#fff',
            fontFamily: 'var(--font-body), sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Clock size={20} color="var(--lime)" />
              <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 18 }}>Une dernière vérification</span>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', margin: '0 0 8px' }}>
              Votre soirée comprend <strong style={{ color: 'var(--lime)' }}>{baseHours + extraHours}h de prestation DJ</strong>
              {extraHours > 0 ? ` (${baseHours}h incluses + ${extraHours}h ajoutées)` : ''}.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', margin: '0 0 22px' }}>
              Est-ce suffisant pour couvrir votre soirée, de l’ouverture du bal à la fin ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { setConfirmOpen(false); submit(); }} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Oui, recevoir mon devis →
              </button>
              <button onClick={() => { setConfirmOpen(false); optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Ajouter des heures
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function FormuleConfigPage({ formuleKey }) {
  const [selectedKey, setSelectedKey] = useState(formuleKey);
  const formule = FORMULES.find(f => f.key === selectedKey);

  /* Change de formule en conservant l'état saisi ; l'URL suit sans navigation (pas de remontage) */
  const switchFormule = (k) => {
    setSelectedKey(k);
    window.history.replaceState(null, '', `/devis/mariage/${k}`);
  };

  if (!formule) {
    return (
      <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'var(--font-body), sans-serif' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Formule introuvable.</p>
        <Link href="/mariage" className="btn-primary">Voir nos formules</Link>
      </div>
    );
  }
  return <Configurator formule={formule} onSwitch={switchFormule} />;
}
