'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Phone, Clock, CalendarX, AlertTriangle } from 'lucide-react';
import MiniCal from '@/app/components/MiniCal';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import TestimonialCarousel from '@/app/components/TestimonialCarousel';
import CallSlotPicker from '@/app/components/CallSlotPicker';
import { gtagEvent, gtagBeacon, gtagSetUserData } from '@/app/lib/gtag';
import { readAttribution, SOURCE_OPTIONS } from '@/app/lib/attribution';

/* Avis mariage — mêmes témoignages que la page /mariage */
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

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 };
const chipStyle = { background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.3)', color: 'var(--lime)', borderRadius: 20, padding: '5px 12px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif' };
const linkBtn = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 10, fontFamily: 'inherit' };

/* Formate une date en évitant tout décalage de fuseau (contrairement à toISOString) */
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function MariageContactClient() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [lieu, setLieu] = useState('');
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
  const [dateFeedback, setDateFeedback] = useState(null); // { type: 'invalide' | 'indisponible', date, suggestion?, suggestions? }
  const [showBrowseCalendar, setShowBrowseCalendar] = useState(false);

  const startedRef = useRef(false); // form_start (étape coordonnées) déjà tiré
  const dateStartedRef = useRef(false); // une interaction a eu lieu sur l'étape date
  const dateMethodRef = useRef('native'); // dernière méthode utilisée : 'native' | 'calendrier_visuel'
  const lastFieldRef = useRef(''); // dernier champ touché dans l'étape coordonnées
  const formPhaseRef = useRef('date');
  const submittedRef = useRef(false);
  const abandonFiredRef = useRef(false);
  const checkDateTimeoutRef = useRef(null); // vérification différée après une saisie native (voir handleNativeDateInput)

  const fmtDateFr = (k) => {
    try { return new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return k; }
  };

  useEffect(() => { formPhaseRef.current = formPhase; }, [formPhase]);

  useEffect(() => () => { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); }, []);

  useEffect(() => {
    const t = new Date();
    const start = toISODate(t);
    const end = toISODate(new Date(t.getFullYear() + 2, t.getMonth(), t.getDate()));
    fetch(`/api/availability?start=${start}&end=${end}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.bookedDates) setBookedDates(new Set(d.bookedDates)); if (d.pendingDates) setPendingDates(d.pendingDates); })
      .catch(() => {})
      .finally(() => setAvailLoading(false));
  }, []);

  /* Abandon : quitte la page sans avoir envoyé — on distingue l'étape date de l'étape coordonnées */
  useEffect(() => {
    const fireAbandon = () => {
      if (submittedRef.current || abandonFiredRef.current) return;
      if (formPhaseRef.current === 'details' && startedRef.current) {
        abandonFiredRef.current = true;
        gtagBeacon('funnel_abandon', { profil: 'mariage', step: 'coordonnees', step_name: lastFieldRef.current || 'inconnu' });
      } else if (formPhaseRef.current === 'date' && dateStartedRef.current) {
        abandonFiredRef.current = true;
        gtagBeacon('funnel_abandon', { profil: 'mariage', step: 'date', step_name: dateMethodRef.current });
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
    gtagEvent('form_start', { profil: 'mariage', step: 'coordonnees', method: 'formulaire_contact' });
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
    gtagEvent('date_disponible', { profil: 'mariage', step: 'date', step_name: methodLabel });
    setFormPhase('details');
    gtagEvent('funnel_step', { profil: 'mariage', step: 'coordonnees', step_name: 'etape_affichee' });
  };

  const notifyBooked = (k, methodLabel) => {
    dateMethodRef.current = methodLabel;
    gtagEvent('date_indisponible', { profil: 'mariage', step: 'date', step_name: methodLabel });
    if (methodLabel === 'native') {
      setDateFeedback({ type: 'indisponible', date: k, suggestions: nextAvailableDates(k) });
    } else {
      setBookedNotice(k);
    }
  };

  const handleNativeDateFocus = () => { dateStartedRef.current = true; dateMethodRef.current = 'native'; };

  /* Un input type="date" déclenche onChange dès qu'UN segment (jour/mois/année) devient complet —
     pas forcément les trois (ex. en tapant "2027" au clavier, on passe réellement par "0002",
     "0020", "0202" avant d'arriver à "2027"). Sur mobile (roue de sélection), il n'y a en revanche
     aucune "sortie de champ" naturelle pour confirmer — la vérification doit donc se faire toute
     seule. Compromis : on attend une courte pause sans nouvelle frappe (la saisie s'est stabilisée)
     avant de vérifier, tout en vérifiant aussi immédiatement sur sortie de champ ou Entrée. */
  const handleNativeDateInput = (k) => {
    setNativeDateInput(k);
    setDateFeedback(null);
    if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current);
    checkDateTimeoutRef.current = setTimeout(() => checkNativeDate(k), 500);
  };

  const checkNativeDate = (k) => {
    if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k) || Number.isNaN(new Date(k + 'T12:00:00').getTime())) return;
    // Un input type="date" peut composer une année invraisemblable pendant la frappe
    // (ex. "0002" en tapant "2027" chiffre par chiffre) : on ignore tout ce qui sort de la
    // plage réellement proposée (aujourd'hui → 2 ans), plutôt que d'afficher une fausse dispo.
    if (k < todayIso || k > maxIso) return;
    dateStartedRef.current = true;
    dateMethodRef.current = 'native';
    if (bookedDates.has(k)) { notifyBooked(k, 'native'); return; }
    gtagEvent('date_verifiee_disponible', { profil: 'mariage', step: 'date', step_name: 'native' });
    setDateFeedback({ type: 'disponible', date: k, pending: pendingDates[k] ?? 0 });
  };

  const openBrowseCalendar = () => {
    if (!showBrowseCalendar) {
      dateStartedRef.current = true;
      gtagEvent('date_browse_ouvert', { profil: 'mariage', step: 'date', step_name: 'calendrier_visuel' });
    }
    setShowBrowseCalendar(s => !s);
  };

  const todayIso = toISODate(new Date());
  const maxIso = toISODate(new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate()));

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const phoneValid = /^[0-9+\s().-]{6,}$/.test(phone);
  const valid = firstName.trim() && lastName.trim() && phoneValid && emailValid && date && guests && lieu.trim();

  const submit = async () => {
    if (sending || !valid) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/leads/mariage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: firstName.trim(), nom: lastName.trim(), tel: phone.trim(),
          email: email.trim().toLowerCase(), date, guests, lieu: lieu.trim(), message: message.trim(),
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
      gtagEvent('generate_lead', { profil: 'mariage', method: 'formulaire_contact' });
      if (data.leadId) {
        setLeadId(data.leadId);
        setStep('slot');
      } else {
        // Pas d'id (insertion du lead a échoué côté serveur) : pas de créneau possible,
        // message générique "sous 24h" comme avant.
        setStep('done');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSending(false);
      setError("La connexion a été interrompue. Vérifiez votre réseau et réessayez, ou appelez-nous au 07 68 53 33 08.");
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      {/* En-tête */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'rgba(6,14,22,0.95)', backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <Link href="/mariage" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} priority />
      </div>

      {step === 'slot' ? (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '56px 20px 70px' }}>
          <CallSlotPicker
            kind="mariage"
            refId={leadId}
            firstName={firstName}
            onBooked={(slot) => { setConfirmedSlot(slot); setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onFallback={() => { setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      ) : step === 'done' ? (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '64px 20px 70px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <CheckCircle2 size={54} color="var(--lime)" style={{ margin: '0 auto 20px' }} />
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 27, fontWeight: 800, marginBottom: 14 }}>
              Merci {firstName} !
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 28 }}>
              {confirmedSlot
                ? <>Votre demande est bien enregistrée. <strong style={{ color: '#fff' }}>Nous vous appelons le {fmtDateFr(confirmedSlot.date)} à {confirmedSlot.time}</strong> pour échanger sur votre mariage et construire ensemble la formule qui vous ressemble.</>
                : <>Votre demande est bien enregistrée. <strong style={{ color: '#fff' }}>Un conseiller vous rappelle sous 24h</strong> (jours ouvrés) pour échanger sur votre mariage et construire ensemble la formule qui vous ressemble.</>}
            </p>
            <Link href="/mariage" className="btn-secondary">Retour à l'accueil mariage</Link>
          </div>

          {/* Preuve sociale pendant l'attente du rappel */}
          <div style={{ marginTop: 52 }}>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>
              Ils en parlent mieux que nous
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              En attendant notre appel, découvrez ce que nos mariés ont vécu.
            </p>
            <TestimonialCarousel items={TESTIMONIALS} force />
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px 70px' }}>
          {formPhase === 'date' ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, textAlign: 'center', lineHeight: 1.12, marginBottom: 12 }}>
                Vérifions la disponibilité de <span style={{ color: 'var(--lime)' }}>votre date</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 520, margin: '0 auto 26px' }}>
                Indiquez la date de votre mariage avec votre calendrier : nous vous disons tout de suite si nous sommes libres ce jour-là.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, textAlign: 'center', lineHeight: 1.12, marginBottom: 12 }}>
                Parlons de <span style={{ color: 'var(--lime)' }}>votre mariage</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 520, margin: '0 auto 26px' }}>
                Laissez-nous quelques informations : un conseiller vous rappelle sous 24h pour construire, de vive voix, la formule idéale pour votre grand jour.
              </p>
            </>
          )}

          {/* Réassurance */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 22px', marginBottom: 34, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={15} color="var(--lime)" /> Gratuit &amp; sans engagement</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} color="var(--lime)" /> Rappel sous 24h (jours ouvrés)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone size={15} color="var(--lime)" /> Un échange humain, pas un robot</span>
          </div>

          {formPhase === 'date' ? (
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Date du mariage</label>
              <input
                type="date"
                value={nativeDateInput}
                min={todayIso}
                max={maxIso}
                onFocus={handleNativeDateFocus}
                onChange={e => handleNativeDateInput(e.target.value)}
                onBlur={e => { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); checkNativeDate(e.target.value); }}
                onKeyDown={e => { if (e.key === 'Enter') { if (checkDateTimeoutRef.current) clearTimeout(checkDateTimeoutRef.current); checkNativeDate(e.target.value); } }}
                disabled={availLoading}
                style={{ ...input, opacity: availLoading ? 0.5 : 1 }}
              />

              {availLoading && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Chargement des disponibilités…</p>
              )}

              {dateFeedback?.type === 'disponible' && dateFeedback.date === nativeDateInput && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.3)', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} color="var(--lime)" /> {fmtDateFr(dateFeedback.date)} — disponible
                  </p>
                  {dateFeedback.pending > 0 && (
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f59e0b', margin: '8px 0 0' }}>
                      <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span><strong>{dateFeedback.pending} devis déjà demandé{dateFeedback.pending > 1 ? 's' : ''}</strong> pour cette date — répondez rapidement à notre appel pour être prioritaire.</span>
                    </p>
                  )}
                  <button onClick={() => confirmDate(dateFeedback.date, 'native')} className="btn-primary" style={{ marginTop: 10, justifyContent: 'center' }}>
                    Valider cette date →
                  </button>
                </div>
              )}

              {dateFeedback?.type === 'indisponible' && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <p style={{ margin: 0 }}>Nous sommes déjà réservés le {fmtDateFr(dateFeedback.date)}.</p>
                  {dateFeedback.suggestions?.length > 0 && (
                    <>
                      <p style={{ fontSize: 12, margin: '8px 0 6px' }}>Prochaines dates libres :</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {dateFeedback.suggestions.map(s => (
                          <button key={s} onClick={() => confirmDate(s, 'native_suggestion')} style={chipStyle}>
                            {fmtDateFr(s)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <button onClick={openBrowseCalendar} style={linkBtn}>
                  {showBrowseCalendar ? 'Masquer le calendrier' : "Je ne sais pas encore ma date — voir les disponibilités"}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <CheckCircle2 size={16} color="var(--lime)" /> {fmtDateFr(date)} — disponible
                </span>
                <button onClick={() => { gtagEvent('date_modifiee', { profil: 'mariage', step: 'date', step_name: 'retour_etape1' }); setFormPhase('date'); }} style={{ background: 'none', border: 'none', color: 'var(--lime)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  Modifier
                </button>
              </div>
              {date && (pendingDates[date] ?? 0) > 0 && (
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f59e0b', marginBottom: 16, marginTop: -8 }}>
                  <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>{pendingDates[date]} devis déjà demandé{pendingDates[date] > 1 ? 's' : ''}</strong> pour cette date — répondez rapidement à notre appel pour être prioritaire.</span>
                </p>
              )}

              {/* Formulaire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Prénom</label><input value={firstName} onFocus={() => touch('prenom')} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" style={input} /></div>
                <div><label style={label}>Nom</label><input value={lastName} onFocus={() => touch('nom')} onChange={e => setLastName(e.target.value)} placeholder="Nom" style={input} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Téléphone</label><input type="tel" value={phone} onFocus={() => touch('telephone')} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={input} /></div>
                <div><label style={label}>Email</label><input type="email" value={email} onFocus={() => touch('email')} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" style={input} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Nombre de personnes</label><input type="number" min={1} value={guests} onFocus={() => touch('personnes')} onChange={e => setGuests(e.target.value)} placeholder="ex. 120" style={input} /></div>
                <div><label style={label}>Lieu de l'événement</label><AddressAutocomplete value={lieu} onChange={(v) => { touch('lieu'); setLieu(v); }} onSelect={(s) => setLieu(s.label)} placeholder="Commune ou lieu de réception" inputStyle={input} /></div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={label}>Votre projet <span style={{ textTransform: 'none', fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(optionnel)</span></label>
                <textarea value={message} onFocus={() => touch('message')} onChange={e => setMessage(e.target.value)} placeholder="Un mot sur vos envies, votre ambiance, vos questions…" rows={3} style={{ ...input, resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={label}>Comment nous avez-vous connu ? <span style={{ textTransform: 'none', fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(optionnel)</span></label>
                <select value={sourceDeclared} onChange={e => setSourceDeclared(e.target.value)} style={{ ...input, color: sourceDeclared ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  <option value="">— Sélectionner —</option>
                  {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 14 }}>{error}</p>}

              <button onClick={submit} disabled={sending || !valid} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: sending || !valid ? 0.5 : 1, cursor: sending || !valid ? 'not-allowed' : 'pointer' }}>
                {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : 'Demander mon devis gratuit →'}
              </button>
              {!valid && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
                  Remplissez vos coordonnées, le nombre de personnes et le lieu pour continuer.
                </p>
              )}
            </>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Pop-up date réservée (calendrier visuel) */}
      {bookedNotice && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setBookedNotice('')} style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1b2a', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14,
            padding: '28px 26px', maxWidth: 400, width: '100%', textAlign: 'center', color: '#fff',
            fontFamily: 'var(--font-body), sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <CalendarX size={32} color="#ef4444" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Date déjà réservée</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', margin: '0 0 22px' }}>
              Nous sommes malheureusement <strong style={{ color: '#fff' }}>déjà réservés le {fmtDateFr(bookedNotice)}</strong>. Choisissez une autre date pour que nous puissions vous accompagner sur votre mariage.
            </p>
            <button onClick={() => setBookedNotice('')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Choisir une autre date
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
