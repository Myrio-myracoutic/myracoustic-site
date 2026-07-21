'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Phone, Clock, CalendarX } from 'lucide-react';
import MiniCal from '@/app/components/MiniCal';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import TestimonialCarousel from '@/app/components/TestimonialCarousel';
import { gtagEvent } from '@/app/lib/gtag';

/* Avis mariage — mêmes témoignages que la page /mariage */
const TESTIMONIALS = [
  { name: 'Carine et Sébastien', event: 'Mariage', stars: 5,
    text: "Un immense merci à Myrio et sa femme Virginie qui nous ont clairement sauvé notre mariage. 2 semaines avant notre DJ initial nous a informé qu'il ne s'assurerait pas la prestation (pour des raisons de santé) et Myrio a été incroyable et rassurant. 2 semaines pour se caler avec nous et l'animation a été parfaite. Nous n'aurions pas pu espérer mieux. Vous voulez un évènement réussi en terme d'animation, Travaillez avec Myrio!" },
  { name: 'Treecy et Jerry', event: 'Mariage', stars: 5,
    text: "C'est un dj très professionnel, compréhensif et qui s'adapte à toutes situations. Le rapport qualité prix est au top. Je recommande fortement. Amusement garantie." },
  { name: 'Sandra et Stéphanie', event: 'Mariage', stars: 5,
    text: "Myrio a été à l'écoute de nos envies, on a tout calé ensemble. Ces propositions ont été pertinentes. Nous l'avions déjà vu comme dj dans des soirées repas d'entreprise et comme nous l'avions apprécié nous l'avons contacté pour notre mariage. Il est en plus super bien équipé en matériel du coup ça facilite pour faire des animations tout au long de la soirée." },
];

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 };

export default function MariageContactClient() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [lieu, setLieu] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState(new Set());
  const [availLoading, setAvailLoading] = useState(true);
  const [bookedNotice, setBookedNotice] = useState('');
  const startedRef = useRef(false);

  const fmtDateFr = (k) => {
    try { return new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return k; }
  };

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

  const touch = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    gtagEvent('form_start', { profil: 'mariage', method: 'formulaire_contact' });
  };

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
        }),
      });
      setSending(false);
      if (!res.ok) {
        setError("Un problème technique nous empêche d'enregistrer votre demande. Réessayez, ou appelez-nous au 07 68 53 33 08.");
        return;
      }
      gtagEvent('generate_lead', { profil: 'mariage', method: 'formulaire_contact' });
      setDone(true);
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

      {done ? (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '64px 20px 70px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <CheckCircle2 size={54} color="var(--lime)" style={{ margin: '0 auto 20px' }} />
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 27, fontWeight: 800, marginBottom: 14 }}>
              Merci {firstName} !
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 28 }}>
              Votre demande est bien enregistrée. <strong style={{ color: '#fff' }}>Un conseiller vous rappelle sous 24h</strong> (jours ouvrés) pour échanger sur votre mariage et construire ensemble la formule qui vous ressemble.
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
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, textAlign: 'center', lineHeight: 1.12, marginBottom: 12 }}>
            Parlons de <span style={{ color: 'var(--lime)' }}>votre mariage</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 520, margin: '0 auto 26px' }}>
            Laissez-nous quelques informations : un conseiller vous rappelle sous 24h pour construire, de vive voix, la formule idéale pour votre grand jour.
          </p>

          {/* Réassurance */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 22px', marginBottom: 34, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={15} color="var(--lime)" /> Gratuit &amp; sans engagement</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} color="var(--lime)" /> Rappel sous 24h (jours ouvrés)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone size={15} color="var(--lime)" /> Un échange humain, pas un robot</span>
          </div>

          {/* Formulaire */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={label}>Prénom</label><input value={firstName} onFocus={touch} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" style={input} /></div>
            <div><label style={label}>Nom</label><input value={lastName} onFocus={touch} onChange={e => setLastName(e.target.value)} placeholder="Nom" style={input} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={label}>Téléphone</label><input type="tel" value={phone} onFocus={touch} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={input} /></div>
            <div><label style={label}>Email</label><input type="email" value={email} onFocus={touch} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" style={input} /></div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>Date du mariage</label>
            <MiniCal selected={date} onSelect={(k) => { touch(); setDate(k); }} onBookedClick={(k) => setBookedNotice(k)} bookedDates={bookedDates} loading={availLoading} yearsAhead={2} />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Les dates déjà réservées sont grisées : si votre date n'est pas disponible, c'est que nous sommes déjà pris ce jour-là.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={label}>Nombre de personnes</label><input type="number" min={1} value={guests} onFocus={touch} onChange={e => setGuests(e.target.value)} placeholder="ex. 120" style={input} /></div>
            <div><label style={label}>Lieu de l'événement</label><AddressAutocomplete value={lieu} onChange={(v) => { touch(); setLieu(v); }} onSelect={(s) => setLieu(s.label)} placeholder="Commune ou lieu de réception" inputStyle={input} /></div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Votre projet <span style={{ textTransform: 'none', fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(optionnel)</span></label>
            <textarea value={message} onFocus={touch} onChange={e => setMessage(e.target.value)} placeholder="Un mot sur vos envies, votre ambiance, vos questions…" rows={3} style={{ ...input, resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 14 }}>{error}</p>}

          <button onClick={submit} disabled={sending || !valid} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: sending || !valid ? 0.5 : 1, cursor: sending || !valid ? 'not-allowed' : 'pointer' }}>
            {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : 'Demander mon devis gratuit →'}
          </button>
          {!valid && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
              Remplissez vos coordonnées, la date, le nombre de personnes et le lieu pour continuer.
            </p>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Pop-up date réservée */}
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
