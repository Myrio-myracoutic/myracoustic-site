'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2, ShieldCheck, Phone, Clock, CalendarX, AlertTriangle, Check } from 'lucide-react';
import MiniCal from '@/app/components/MiniCal';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import CallSlotPicker from '@/app/components/CallSlotPicker';
import { gtagEvent, gtagBeacon, gtagSetUserData } from '@/app/lib/gtag';
import { dateDepuisAdresse } from '@/app/lib/date-depuis-adresse';
import { readAttribution, SOURCE_OPTIONS_PRO } from '@/app/lib/attribution';
import { TYPES_EVENEMENT, BESOINS_PARTICULIER } from '@/app/lib/particulier-demande';

/* Demande d'un particulier (anniversaire, soirée privée, baptême… — 17/11). Remplace le devis
   instantané : décision de Myrio, même parcours que les mariages et les pros (demande, appel,
   proposition sur mesure). Même déroulé que le formulaire mariage (MariageContactClient.js) :
   la date d'abord, avec la disponibilité tout de suite, puis les coordonnées, puis le choix du
   créneau d'appel. Les deux fichiers partagent cette mécanique ; celui du mariage n'a pas été
   touché pour ne prendre aucun risque sur le parcours qui reçoit la publicité. */

const PROFIL = 'particulier';

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', minHeight: 46, color: '#fff', fontSize: 16, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 7 };
const optionnel = { textTransform: 'none', fontWeight: 400, color: 'rgba(255,255,255,0.45)' };
const chipStyle = { background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.3)', color: 'var(--lime)', borderRadius: 20, padding: '5px 12px', minHeight: 36, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif' };
const linkBtn = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: '10px 0', marginTop: 4, fontFamily: 'inherit' };

/* Formate une date en évitant tout décalage de fuseau (contrairement à toISOString) */
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtDateFr = (k) => {
  try { return new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return k; }
};

export default function ParticulierDemandeClient() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [guests, setGuests] = useState('');
  const [lieu, setLieu] = useState('');
  const [besoins, setBesoins] = useState([]);
  const [message, setMessage] = useState('');
  const [sourceDeclared, setSourceDeclared] = useState('');
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'slot' | 'done'
  const [leadId, setLeadId] = useState(null);
  const [confirmedSlot, setConfirmedSlot] = useState(null); // { date, time }
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState(new Set());
  const [pendingDates, setPendingDates] = useState({});
  const [availLoading, setAvailLoading] = useState(true);
  const [bookedNotice, setBookedNotice] = useState('');

  /* Qualification de la date en amont, avant le reste du formulaire */
  const [formPhase, setFormPhase] = useState('date'); // 'date' | 'details'
  const [nativeDateInput, setNativeDateInput] = useState('');
  const [dateFeedback, setDateFeedback] = useState(null); // { type: 'disponible' | 'indisponible', date, suggestions? }
  const [showBrowseCalendar, setShowBrowseCalendar] = useState(false);

  const startedRef = useRef(false); // form_start (étape coordonnées) déjà tiré
  const dateStartedRef = useRef(false); // une interaction a eu lieu sur l'étape date
  const dateMethodRef = useRef('native'); // dernière méthode utilisée : 'native' | 'calendrier_visuel'
  const lastFieldRef = useRef(''); // dernier champ touché dans l'étape coordonnées
  const formPhaseRef = useRef('date');
  const submittedRef = useRef(false);
  const abandonFiredRef = useRef(false);
  const pendingCheckRef = useRef(null); // date saisie avant la fin du chargement des disponibilités
  const checkNativeDateRef = useRef(null); // toujours la dernière version de checkNativeDate (appelée après un délai)
  const feedbackRef = useRef(null);
  const checkDateTimeoutRef = useRef(null); // vérification différée après une saisie native

  useEffect(() => { formPhaseRef.current = formPhase; }, [formPhase]);

  useEffect(() => () => { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); }, []);

  useEffect(() => {
    const t = new Date();
    const start = toISODate(t);
    const end = toISODate(new Date(t.getFullYear() + 2, t.getMonth(), t.getDate()));
    fetch(`/api/availability?start=${start}&end=${end}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.bookedDates) setBookedDates(new Set(d.bookedDates)); if (d.pendingDates) setPendingDates(d.pendingDates); })
      .catch(() => {})
      .finally(() => setAvailLoading(false));
  }, []);

  /* Abandon : quitte la page sans avoir envoyé — on distingue l'étape date de l'étape coordonnées */
  useEffect(() => {
    const fireAbandon = () => {
      if (submittedRef.current || abandonFiredRef.current) return;
      if (formPhaseRef.current === 'details' && startedRef.current) {
        abandonFiredRef.current = true;
        gtagBeacon('funnel_abandon', { profil: PROFIL, step: 'coordonnees', step_name: lastFieldRef.current || 'inconnu' });
      } else if (formPhaseRef.current === 'date' && dateStartedRef.current) {
        abandonFiredRef.current = true;
        gtagBeacon('funnel_abandon', { profil: PROFIL, step: 'date', step_name: dateMethodRef.current });
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') fireAbandon(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', fireAbandon);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', fireAbandon);
    };
  }, []);

  const touch = (field) => {
    lastFieldRef.current = field;
    if (startedRef.current) return;
    startedRef.current = true;
    gtagEvent('form_start', { profil: PROFIL, step: 'coordonnees', method: 'formulaire_contact' });
  };

  /* Prochaines dates libres après une date déjà réservée (calcul local, pas de nouvel appel réseau) */
  const nextAvailableDates = (fromKey, count = 3) => {
    const out = [];
    const d = new Date(fromKey + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    let guard = 0;
    while (out.length < count && guard < 400) {
      const k = toISODate(d);
      if (!bookedDates.has(k)) out.push(k);
      d.setDate(d.getDate() + 1);
      guard++;
    }
    return out;
  };

  const confirmDate = (k, methodLabel) => {
    setDate(k);
    setNativeDateInput(k);
    setDateFeedback(null);
    dateMethodRef.current = methodLabel;
    gtagEvent('date_disponible', { profil: PROFIL, step: 'date', step_name: methodLabel });
    setFormPhase('details');
    gtagEvent('funnel_step', { profil: PROFIL, step: 'coordonnees', step_name: 'etape_affichee' });
  };

  const notifyBooked = (k, methodLabel) => {
    dateMethodRef.current = methodLabel;
    gtagEvent('date_indisponible', { profil: PROFIL, step: 'date', step_name: methodLabel });
    if (methodLabel === 'native') {
      setDateFeedback({ type: 'indisponible', date: k, suggestions: nextAvailableDates(k) });
    } else {
      setBookedNotice(k);
    }
  };

  const todayIso = toISODate(new Date());
  const maxIso = toISODate(new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate()));

  const handleNativeDateFocus = () => { dateStartedRef.current = true; dateMethodRef.current = 'native'; };

  /* Un champ de date prévient dès qu'UN segment (jour, mois, année) est complet, et sur téléphone
     il n'y a pas de « sortie de champ » naturelle : on attend une courte pause sans nouvelle frappe
     avant de vérifier, tout en vérifiant aussi à la sortie du champ ou sur Entrée (même réglage que
     le formulaire mariage). */
  const handleNativeDateInput = (k) => {
    setNativeDateInput(k);
    setDateFeedback(null);
    pendingCheckRef.current = null;
    if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current);
    checkDateTimeoutRef.current = setTimeout(() => checkNativeDateRef.current?.(k), 500);
  };

  const checkNativeDate = (k) => {
    if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k) || Number.isNaN(new Date(k + 'T12:00:00').getTime())) return;
    // Année invraisemblable pendant la frappe (« 0002 » en tapant « 2027 ») : on ignore tout ce qui
    // sort de la plage proposée (aujourd'hui → 2 ans), plutôt que d'afficher une fausse disponibilité.
    if (k < todayIso || k > maxIso) return;
    dateStartedRef.current = true;
    dateMethodRef.current = 'native';
    // Disponibilités pas encore chargées : la vérification repart à la fin du chargement.
    if (availLoading) { pendingCheckRef.current = k; return; }
    if (bookedDates.has(k)) { notifyBooked(k, 'native'); return; }
    gtagEvent('date_verifiee_disponible', { profil: PROFIL, step: 'date', step_name: 'native' });
    setDateFeedback({ type: 'disponible', date: k, pending: pendingDates[k] ?? 0 });
  };

  useEffect(() => {
    checkNativeDateRef.current = checkNativeDate;
    if (!availLoading && pendingCheckRef.current) {
      const k = pendingCheckRef.current;
      pendingCheckRef.current = null;
      checkNativeDate(k);
    }
  });

  /* Date transmise par Aria (bouton « Prendre rendez-vous » après une date vérifiée libre, avec le
     même agenda) : l'étape date est sautée, la personne arrive directement sur ses coordonnées.
     « Modifier » reste possible. Si la date a été prise entre-temps, l'étape date s'affiche avec le
     message habituel « déjà réservée ». Une seule fois, après le chargement des disponibilités. */
  const dateAdresseLueRef = useRef(false);
  useEffect(() => {
    if (availLoading || dateAdresseLueRef.current) return;
    dateAdresseLueRef.current = true;
    const k = dateDepuisAdresse(todayIso, maxIso);
    if (!k) return;
    dateStartedRef.current = true;
    if (bookedDates.has(k)) { setNativeDateInput(k); notifyBooked(k, 'native'); return; }
    confirmDate(k, 'aria');
  }, [availLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sur téléphone, le résultat (et le bouton « Valider cette date ») peut tomber sous le bandeau
     cookies ou sous le bas de l'écran : on le ramène à l'écran. */
  useEffect(() => {
    if (!dateFeedback || !feedbackRef.current) return;
    const reserve = parseInt(document.body.style.paddingBottom, 10) || 0;
    if (feedbackRef.current.getBoundingClientRect().bottom > window.innerHeight - reserve) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [dateFeedback]);

  const openBrowseCalendar = () => {
    if (!showBrowseCalendar) {
      dateStartedRef.current = true;
      gtagEvent('date_browse_ouvert', { profil: PROFIL, step: 'date', step_name: 'calendrier_visuel' });
    }
    setShowBrowseCalendar((s) => !s);
  };

  const toggleBesoin = (b) => {
    touch('besoins');
    setBesoins((l) => (l.includes(b) ? l.filter((x) => x !== b) : [...l, b]));
  };

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const phoneValid = /^[0-9+\s().-]{6,}$/.test(phone);
  const valid = firstName.trim() && lastName.trim() && phoneValid && emailValid && date && eventType && guests && lieu.trim();

  const submit = async () => {
    if (sending || !valid) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/contact/particulier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: firstName.trim(), nom: lastName.trim(), tel: phone.trim(),
          email: email.trim().toLowerCase(), date, type: eventType, personnes: guests,
          lieu: lieu.trim(), besoins, message: message.trim(),
          ...readAttribution(), sourceDeclared: sourceDeclared || null,
        }),
      });
      setSending(false);
      if (!res.ok) {
        setError("Un problème technique nous empêche d'enregistrer votre demande. Réessayez, ou appelez-nous au 07 68 53 33 08.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      submittedRef.current = true;
      gtagSetUserData({ email, phone, firstName, lastName });
      gtagEvent('generate_lead', { profil: PROFIL, method: 'formulaire_contact' });
      if (data.leadId) {
        setLeadId(data.leadId);
        setStep('slot');
      } else {
        // Pas d'identifiant (la demande n'a pas pu être enregistrée côté serveur) : pas de créneau
        // possible, message « sous 24h ».
        setStep('done');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSending(false);
      setError('La connexion a été interrompue. Vérifiez votre réseau et réessayez, ou appelez-nous au 07 68 53 33 08.');
    }
  };

  return (
    <div className="dp" style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      {/* En-tête */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'sticky', top: 0, background: 'rgba(6,14,22,0.95)', backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <Image src="/logo.png" alt="Myracoustic" width={69} height={34} style={{ height: 34, width: 'auto' }} priority />
      </div>

      {step === 'slot' ? (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '56px 20px 70px' }}>
          <CallSlotPicker
            kind="pro_contact"
            refId={leadId}
            firstName={firstName}
            subtitle={`Merci ${firstName} ! Un dernier pas : dites-nous quand vous appeler pour parler de votre événement.`}
            onBooked={(slot) => { setConfirmedSlot(slot); setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onFallback={() => { setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      ) : step === 'done' ? (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '64px 20px 70px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <CheckCircle2 size={54} color="var(--lime)" style={{ margin: '0 auto 20px' }} aria-hidden="true" />
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 27, fontWeight: 800, marginBottom: 14 }}>
              Merci {firstName} !
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 28 }}>
              {confirmedSlot
                ? <>Votre demande est bien enregistrée. <strong style={{ color: '#fff' }}>Nous vous appelons le {fmtDateFr(confirmedSlot.date)} à {confirmedSlot.time}</strong> pour parler de votre événement et préparer une proposition qui vous ressemble.</>
                : <>Votre demande est bien enregistrée. <strong style={{ color: '#fff' }}>Nous vous rappelons sous 24h</strong> (jours ouvrés) pour parler de votre événement et préparer une proposition qui vous ressemble.</>}
            </p>
            <Link href="/evenements-prives" className="btn-secondary">Retour aux événements privés</Link>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px 70px' }}>
          {formPhase === 'date' ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, textAlign: 'center', lineHeight: 1.12, marginBottom: 12 }}>
                Vérifions la disponibilité de <span style={{ color: 'var(--lime)' }}>votre date</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 520, margin: '0 auto 26px' }}>
                Indiquez la date de votre événement : nous vous disons tout de suite si nous sommes libres ce jour-là.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, textAlign: 'center', lineHeight: 1.12, marginBottom: 12 }}>
                Parlons de <span style={{ color: 'var(--lime)' }}>votre événement</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 520, margin: '0 auto 26px' }}>
                Quelques informations suffisent : nous vous rappelons sous 24h pour imaginer, de vive voix, la soirée qui vous ressemble.
              </p>
            </>
          )}

          {/* Réassurance */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 22px', marginBottom: 34, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={15} color="var(--lime)" aria-hidden="true" /> Gratuit &amp; sans engagement</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} color="var(--lime)" aria-hidden="true" /> Rappel sous 24h (jours ouvrés)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone size={15} color="var(--lime)" aria-hidden="true" /> Un échange humain, pas un robot</span>
          </div>

          {formPhase === 'date' ? (
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="dp-date" style={label}>Date de votre événement</label>
              <input
                id="dp-date"
                type="date"
                value={nativeDateInput}
                min={todayIso}
                max={maxIso}
                onFocus={handleNativeDateFocus}
                onChange={(e) => handleNativeDateInput(e.target.value)}
                onBlur={(e) => { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); checkNativeDate(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); checkNativeDate(e.target.value); } }}
                style={input}
              />

              {availLoading && nativeDateInput && (
                <p role="status" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Vérification de la disponibilité…</p>
              )}

              <div ref={feedbackRef} aria-live="polite">
                {dateFeedback?.type === 'disponible' && dateFeedback.date === nativeDateInput && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.3)', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={15} color="var(--lime)" aria-hidden="true" /> {fmtDateFr(dateFeedback.date)} — disponible
                    </p>
                    {dateFeedback.pending > 0 && (
                      <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f59e0b', margin: '8px 0 0' }}>
                        <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                        <span><strong>{dateFeedback.pending} devis déjà demandé{dateFeedback.pending > 1 ? 's' : ''}</strong> pour cette date — répondez rapidement à notre appel pour être prioritaire.</span>
                      </p>
                    )}
                    <button type="button" onClick={() => confirmDate(dateFeedback.date, 'native')} className="btn-primary" style={{ marginTop: 10, justifyContent: 'center' }}>
                      Valider cette date →
                    </button>
                  </div>
                )}

                {dateFeedback?.type === 'indisponible' && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    <p style={{ margin: 0 }}>Nous sommes déjà réservés le {fmtDateFr(dateFeedback.date)}.</p>
                    {dateFeedback.suggestions?.length > 0 && (
                      <>
                        <p style={{ fontSize: 12, margin: '8px 0 6px' }}>Prochaines dates libres :</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {dateFeedback.suggestions.map((s) => (
                            <button type="button" key={s} onClick={() => confirmDate(s, 'native_suggestion')} style={chipStyle}>
                              {fmtDateFr(s)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <button type="button" onClick={openBrowseCalendar} aria-expanded={showBrowseCalendar} style={linkBtn}>
                  {showBrowseCalendar ? 'Masquer le calendrier' : 'Je ne sais pas encore ma date — voir les disponibilités'}
                </button>
              </div>

              {showBrowseCalendar && (
                <div style={{ marginTop: 12 }}>
                  <MiniCal
                    selected={date}
                    onSelect={(k) => confirmDate(k, 'calendrier_visuel')}
                    onBookedClick={(k) => notifyBooked(k, 'calendrier_visuel')}
                    onPendingClick={(k) => confirmDate(k, 'calendrier_visuel')}
                    devisPending={pendingDates}
                    bookedDates={bookedDates}
                    loading={availLoading}
                    yearsAhead={2}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Bandeau date confirmée */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 8, padding: '6px 14px', marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <CheckCircle2 size={16} color="var(--lime)" aria-hidden="true" /> {fmtDateFr(date)} — disponible
                </span>
                <button type="button" onClick={() => { gtagEvent('date_modifiee', { profil: PROFIL, step: 'date', step_name: 'retour_etape1' }); setFormPhase('date'); }} style={{ background: 'none', border: 'none', color: 'var(--lime)', fontSize: 13, minHeight: 44, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  Modifier
                </button>
              </div>
              {date && (pendingDates[date] ?? 0) > 0 && (
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f59e0b', marginBottom: 16, marginTop: -8 }}>
                  <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <span><strong>{pendingDates[date]} devis déjà demandé{pendingDates[date] > 1 ? 's' : ''}</strong> pour cette date — répondez rapidement à notre appel pour être prioritaire.</span>
                </p>
              )}

              {/* Formulaire */}
              <div className="dp-duo">
                <div><label htmlFor="dp-prenom" style={label}>Prénom</label><input id="dp-prenom" name="prenom" autoComplete="given-name" value={firstName} onFocus={() => touch('prenom')} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" style={input} /></div>
                <div><label htmlFor="dp-nom" style={label}>Nom</label><input id="dp-nom" name="nom" autoComplete="family-name" value={lastName} onFocus={() => touch('nom')} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" style={input} /></div>
              </div>
              <div className="dp-duo">
                <div><label htmlFor="dp-tel" style={label}>Téléphone</label><input id="dp-tel" name="tel" type="tel" inputMode="tel" autoComplete="tel" value={phone} onFocus={() => touch('telephone')} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={input} /></div>
                <div><label htmlFor="dp-email" style={label}>Email</label><input id="dp-email" name="email" type="email" inputMode="email" autoComplete="email" value={email} onFocus={() => touch('email')} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" style={input} /></div>
              </div>

              <div className="dp-duo">
                <div>
                  <label htmlFor="dp-type" style={label}>Type d&apos;événement</label>
                  <select id="dp-type" name="type" value={eventType} onFocus={() => touch('type')} onChange={(e) => setEventType(e.target.value)} style={{ ...input, color: eventType ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    <option value="">— Sélectionner —</option>
                    {TYPES_EVENEMENT.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label htmlFor="dp-invites" style={label}>Nombre d&apos;invités</label><input id="dp-invites" name="invites" type="number" inputMode="numeric" min={1} value={guests} onFocus={() => touch('personnes')} onChange={(e) => setGuests(e.target.value)} placeholder="ex. 60" style={input} /></div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="dp-lieu" style={label}>Lieu de l&apos;événement</label>
                <AddressAutocomplete inputId="dp-lieu" value={lieu} onChange={(v) => { touch('lieu'); setLieu(v); }} onSelect={(s) => setLieu(s.label)} placeholder="Commune ou lieu de réception" inputStyle={input} />
              </div>

              <fieldset style={{ border: 'none', margin: '0 0 14px', padding: 0, minWidth: 0 }}>
                <legend style={{ ...label, padding: 0 }}>Ce qui vous ferait plaisir <span style={optionnel}>(optionnel)</span></legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BESOINS_PARTICULIER.map((b) => {
                    const actif = besoins.includes(b);
                    return (
                      <button type="button" key={b} onClick={() => toggleBesoin(b)} aria-pressed={actif} className="dp-envie" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 14px', borderRadius: 22, cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: actif ? 700 : 500,
                        border: `1px solid ${actif ? 'var(--lime)' : 'rgba(255,255,255,0.16)'}`,
                        background: actif ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.04)',
                        color: actif ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
                      }}>
                        {actif && <Check size={15} aria-hidden="true" />}{b}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="dp-message" style={label}>Votre projet <span style={optionnel}>(optionnel)</span></label>
                <textarea id="dp-message" name="message" value={message} onFocus={() => touch('message')} onChange={(e) => setMessage(e.target.value)} placeholder="Un mot sur vos envies, votre ambiance, vos questions…" rows={3} style={{ ...input, resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="dp-source" style={label}>Comment nous avez-vous connu ? <span style={optionnel}>(optionnel)</span></label>
                <select id="dp-source" name="source" value={sourceDeclared} onChange={(e) => setSourceDeclared(e.target.value)} style={{ ...input, color: sourceDeclared ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  <option value="">— Sélectionner —</option>
                  {SOURCE_OPTIONS_PRO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div aria-live="assertive">
                {error && <p role="alert" style={{ color: '#f87171', fontSize: 14, marginBottom: 14 }}>{error}</p>}
              </div>

              <button type="button" onClick={submit} disabled={sending || !valid} aria-busy={sending} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: sending || !valid ? 0.5 : 1, cursor: sending || !valid ? 'not-allowed' : 'pointer' }}>
                {sending ? <><Loader2 size={16} style={{ animation: 'dp-spin 0.8s linear infinite' }} aria-hidden="true" /> Envoi…</> : 'Demander mon devis gratuit →'}
              </button>
              {!valid && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10 }}>
                  Remplissez vos coordonnées, le type d&apos;événement, le nombre d&apos;invités et le lieu pour continuer.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dp-spin { to { transform: rotate(360deg); } }
        .dp-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 480px) { .dp-duo { grid-template-columns: 1fr; } }
        .dp :is(input, select, textarea):focus-visible { border-color: var(--lime) !important; }
        .dp button:focus-visible, .dp a:focus-visible { outline: 2px solid var(--lime); outline-offset: 2px; }
        .dp-envie { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .dp select option { color: #0d1b2a; }
        @media (prefers-reduced-motion: reduce) { .dp * { transition: none !important; scroll-behavior: auto !important; } }
      `}</style>

      {/* Pop-up date réservée (calendrier visuel) */}
      {bookedNotice && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setBookedNotice('')} style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="dp-reservee" onClick={(e) => e.stopPropagation()} style={{
            background: '#0d1b2a', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14,
            padding: '28px 26px', maxWidth: 400, width: '100%', textAlign: 'center', color: '#fff',
            fontFamily: 'var(--font-body), sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <CalendarX size={32} color="#ef4444" style={{ margin: '0 auto 14px' }} aria-hidden="true" />
            <div id="dp-reservee" style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Date déjà réservée</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', margin: '0 0 22px' }}>
              Nous sommes malheureusement <strong style={{ color: '#fff' }}>déjà réservés le {fmtDateFr(bookedNotice)}</strong>. Choisissez une autre date pour que nous puissions vous accompagner.
            </p>
            <button type="button" autoFocus onClick={() => setBookedNotice('')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Choisir une autre date
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
