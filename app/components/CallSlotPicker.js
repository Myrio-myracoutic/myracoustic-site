'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Phone, Video, AlertTriangle } from 'lucide-react';
import { avecVisio } from '@/app/lib/rendez-vous-visio';

const JOURS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

const DEFAULT_SUBTITLE = {
  // Premier rendez-vous mariage : en visio depuis le 25/11 (les autres restent des appels).
  mariage: (firstName) => `Merci ${firstName} ! Un dernier pas : choisissez le moment de notre rendez-vous en visio, pour parler de votre mariage.`,
  devis: (firstName) => `Merci ${firstName} ! Dites-nous quand vous appeler pour finaliser votre devis.`,
  pro_contact: (firstName) => `Merci ${firstName} ! Dites-nous quand vous appeler pour échanger sur votre projet.`,
};

/* Liste des 8 jours réservables (aujourd'hui + 7), en date locale (pas UTC —
   toISOString() décalerait la date près de minuit selon le fuseau du visiteur). */
function nextDays(count) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    out.push({ key, label: JOURS_FR[cur.getDay()], num: cur.getDate() });
  }
  return out;
}

// Créneaux libres d'un jour (AAAA-MM-JJ). Lève une erreur si le serveur ne répond pas.
async function fetchSlots(date) {
  const res = await fetch(`/api/call-availability?date=${date}`, { cache: 'no-store' });
  if (!res.ok) throw new Error();
  return (await res.json()).slots || [];
}

function fmtDateFr(k) {
  try { return new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  catch { return k; }
}

/* kind : 'mariage' (défaut), 'devis' (particulier/pro ciblé) ou 'pro_contact' —
   détermine quelle fiche Supabase reçoit le créneau (voir app/lib/call-booking.js).
   token : si fourni (page /rendez-vous/[token]), réserve via cette fiche identifiée par jeton
   plutôt que par refId direct — même mécanisme que le lien envoyé par email. */
export default function CallSlotPicker({ kind = 'mariage', refId, token, firstName, subtitle, onBooked, onFallback }) {
  const days = nextDays(8);
  // Jour ouvert à l'arrivée : le premier qui a un créneau (cherché plus bas), pas forcément aujourd'hui.
  const [selectedDate, setSelectedDate] = useState(null);
  // Créneaux déjà reçus pendant cette recherche, pour ne pas les redemander : { date, slots }.
  const dejaCharge = useRef(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(false);
  const [bookingTime, setBookingTime] = useState(null);
  const [bookError, setBookError] = useState('');

  const loadSlots = useCallback(async (date) => {
    setSlotsLoading(true); setSlotsError(false); setBookError('');
    try {
      const deja = dejaCharge.current;
      dejaCharge.current = null;
      setSlots(deja?.date === date ? deja.slots : await fetchSlots(date));
    } catch {
      setSlotsError(true);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  /* À l'ouverture, on avance jour par jour jusqu'au premier créneau libre : les créneaux du jour même
     sont souvent passés ou trop proches, et l'écran s'ouvrait sur « Aucun créneau disponible ».
     Sans aucun créneau sur les 8 jours (ou si le serveur ne répond pas), on reste sur aujourd'hui. */
  useEffect(() => {
    let annule = false;
    (async () => {
      let choisi = days[0].key;
      try {
        for (const d of days) {
          const s = await fetchSlots(d.key);
          if (annule) return;
          if (d.key === days[0].key || s.length) dejaCharge.current = { date: d.key, slots: s };
          if (s.length) { choisi = d.key; break; }
        }
      } catch { /* loadSlots redemandera le jour choisi et affichera l'erreur si elle persiste */ }
      if (!annule) setSelectedDate(choisi);
    })();
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois, à l'ouverture
  }, []);

  useEffect(() => { if (selectedDate) loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  const book = async (time) => {
    if (bookingTime) return;
    setBookingTime(time); setBookError('');
    try {
      const res = await fetch(token ? `/api/rendez-vous/${token}` : '/api/call-bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { date: selectedDate, time } : { kind, refId, date: selectedDate, time }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // visio : la salle a bien été créée (sinon le rendez-vous se fait par téléphone, comme avant).
        onBooked({ date: selectedDate, time, visio: !!data.visio });
        return;
      }
      if (data.error === 'slot_taken' || data.error === 'lead_already_booked') {
        setBookError('Ce créneau vient d\'être pris à l\'instant — choisissez-en un autre.');
        loadSlots(selectedDate);
      } else {
        setBookError('Un problème technique nous empêche de réserver ce créneau.');
      }
    } catch {
      setBookError('La connexion a été interrompue. Réessayez.');
    } finally {
      setBookingTime(null);
    }
  };

  const displaySubtitle = subtitle || (DEFAULT_SUBTITLE[kind] || DEFAULT_SUBTITLE.mariage)(firstName);
  const visio = avecVisio(kind);
  const Icone = visio ? Video : Phone;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Icone size={40} color="var(--lime)" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 25, fontWeight: 800, marginBottom: 10 }}>
          {visio ? 'Choisissez le moment de notre rendez-vous en visio' : 'Choisissez votre créneau d\'appel'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7 }}>
          {displaySubtitle}
        </p>
      </div>

      {/* Bandeau des 8 jours */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 20 }}>
        {days.map(d => (
          <button key={d.key} onClick={() => setSelectedDate(d.key)} aria-pressed={selectedDate === d.key} style={{
            flex: '0 0 auto', width: 56, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
            border: `1.5px solid ${selectedDate === d.key ? 'var(--lime)' : 'rgba(255,255,255,0.12)'}`,
            background: selectedDate === d.key ? 'rgba(184,239,11,0.12)' : 'rgba(255,255,255,0.03)',
            color: selectedDate === d.key ? 'var(--lime)' : 'rgba(255,255,255,0.65)',
            fontFamily: 'var(--font-display), sans-serif', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.8 }}>{d.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{d.num}</div>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14, textTransform: 'capitalize' }}>
        {selectedDate ? fmtDateFr(selectedDate) : '\u00a0'}
      </p>

      {/* Créneaux */}
      {slotsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
          <Loader2 size={22} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : slotsError ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          <AlertTriangle size={22} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
          Impossible de charger les créneaux disponibles pour le moment.
        </div>
      ) : slots.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14, fontStyle: 'italic' }}>
          Aucun créneau disponible ce jour-là. Essayez un autre jour.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
          {slots.map(t => (
            <button key={t} onClick={() => book(t)} disabled={!!bookingTime} style={{
              padding: '10px 0', borderRadius: 8, cursor: bookingTime ? 'wait' : 'pointer',
              border: '1.5px solid rgba(184,239,11,0.4)', background: 'rgba(184,239,11,0.06)',
              color: 'var(--lime)', fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
              opacity: bookingTime && bookingTime !== t ? 0.4 : 1,
            }}>
              {bookingTime === t ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : t}
            </button>
          ))}
        </div>
      )}

      {bookError && <p style={{ color: '#ef4444', fontSize: 13.5, marginTop: 14, textAlign: 'center' }}>{bookError}</p>}

      {onFallback && (
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button onClick={onFallback} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13,
            textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Continuer sans choisir de créneau — on vous rappelle sous 24h
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
