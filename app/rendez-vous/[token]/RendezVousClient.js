'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Video } from 'lucide-react';
import { lienRejoindre, INFO_ENREGISTREMENT_VISIO, INFO_ENREGISTREMENT_APPEL } from '@/app/lib/rendez-vous-visio';
import CallSlotPicker from '@/app/components/CallSlotPicker';

const PLATEFORME = process.env.NEXT_PUBLIC_PLATEFORME_URL || 'https://app.myracoustic.com';

/* Tous les rendez-vous sont enregistrés (26/11) : on le dit ici, avant l'échange. */
function InfoEnregistrement({ visio, marge = 0 }) {
  return <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.6, margin: marge }}>{visio ? INFO_ENREGISTREMENT_VISIO : INFO_ENREGISTREMENT_APPEL}</p>;
}

/* Premier rendez-vous mariage : lien discret vers le questionnaire, qui vit sur la plateforme (25/11). */
function LienQuestionnaire({ token, marge = 0 }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 15, lineHeight: 1.6, margin: marge }}>
      Envie de préparer notre rendez-vous ? Quelques questions à cocher, quand vous voulez.<br />
      <a href={`${PLATEFORME}/rendez-vous/${token}/questionnaire`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'var(--lime, #b8ef0b)', fontSize: 16, fontWeight: 700, textDecoration: 'underline' }}>
        Préparer notre rendez-vous
      </a>
    </p>
  );
}

const TOPIC_SUBTITLE = {
  // Premier rendez-vous mariage : en visio depuis le 25/11.
  mariage: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange : nous nous retrouvons en visio pour parler de votre mariage.`,
  devis: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour qu'on échange sur votre devis.`,
  pro_contact: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour qu'on échange sur votre projet.`,
  event_milestone: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour la suite de votre accompagnement Myracoustic.`,
};

function fmtScheduled(iso) {
  try {
    // « Mercredi 2 décembre à 17:30 » : une seule capitale, en tête (plus de majuscule à chaque mot).
    const texte = new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  } catch { return iso; }
}

export default function RendezVousClient({ token }) {
  const [state, setState] = useState('loading'); // loading | invalid | ready
  const [info, setInfo] = useState(null);
  const [booked, setBooked] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetch(`/api/rendez-vous/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setInfo(d); setState('ready'); })
      .catch(() => setState('invalid'));
  }, [token]);

  const shellStyle = { minHeight: '100vh', background: 'var(--bg, #0d1b2a)', color: '#fff', padding: 'clamp(28px,6vw,72px) 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  if (state === 'loading') {
    return <div style={shellStyle}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Chargement…</p></div>;
  }

  if (state === 'invalid') {
    return (
      <div style={shellStyle}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Lien invalide ou expiré</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14.5, lineHeight: 1.7 }}>
            Ce lien de prise de rendez-vous n'est plus valable. Contactez-nous directement au 07 68 53 33 08 ou par email à contact@myracoustic.com.
          </p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div style={shellStyle}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <CheckCircle2 size={40} color="var(--lime, #b8ef0b)" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>C'est noté !</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14.5, lineHeight: 1.7 }}>
            {booked.visio
              ? 'Votre rendez-vous en visio est confirmé. Le bouton pour nous rejoindre vient de partir par e-mail : gardez-le précieusement.'
              : 'Votre appel est confirmé — vous recevrez un email de confirmation. Un conseiller Myracoustic vous appellera à ce moment-là.'}
          </p>
          {info.kind === 'mariage' && <LienQuestionnaire token={token} marge="20px 0 0" />}
          <InfoEnregistrement visio={booked.visio} marge="16px 0 0" />
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={{ width: '100%' }}>
        {info.alreadyScheduled && !showPicker ? (
          <div style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
            <CheckCircle2 size={36} color="var(--lime, #b8ef0b)" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              {info.visio ? 'Votre rendez-vous en visio est programmé' : 'Votre appel est déjà programmé'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              {fmtScheduled(info.alreadyScheduled)}
            </p>
            {/* Une seule action principale (rejoindre), le changement de créneau reste discret en dessous. */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {info.visioPrete && (
                <>
                  <a href={lienRejoindre(token, process.env.NEXT_PUBLIC_PLATEFORME_URL || undefined)} className="btn-primary" style={{ justifyContent: 'center', minHeight: 48, borderRadius: 8, fontSize: 16, textDecoration: 'none' }}>
                    <Video size={18} aria-hidden="true" /> Rejoindre la visio
                  </a>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    Le jour venu, touchez ce bouton. Un souci de connexion ? Nous vous appelons.
                  </p>
                </>
              )}
              {info.kind === 'mariage' && <LienQuestionnaire token={token} />}
              <button onClick={() => setShowPicker(true)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', minHeight: 44,
                borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
              }}>
                Choisir un autre créneau
              </button>
            </div>
            <InfoEnregistrement visio={info.visio} marge="20px 0 0" />
          </div>
        ) : (
          <CallSlotPicker
            kind={info.kind}
            token={token}
            firstName={info.firstName}
            subtitle={(TOPIC_SUBTITLE[info.kind] || TOPIC_SUBTITLE.mariage)(info.firstName)}
            onBooked={(slot) => setBooked(slot)}
          />
        )}
      </div>
    </div>
  );
}
