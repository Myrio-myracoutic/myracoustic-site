'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import CallSlotPicker from '@/app/components/CallSlotPicker';

const TOPIC_SUBTITLE = {
  mariage: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour qu'on échange sur votre mariage.`,
  devis: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour qu'on échange sur votre devis.`,
  pro_contact: (firstName) => `Bonjour ${firstName}, choisissez le moment qui vous arrange pour qu'on échange sur votre projet.`,
};

function fmtScheduled(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
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
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14.5, lineHeight: 1.7 }}>
            Votre appel est confirmé — vous recevrez un email de confirmation. Un conseiller Myracoustic vous appellera à ce moment-là.
          </p>
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
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Votre appel est déjà programmé</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 24, textTransform: 'capitalize' }}>
              {fmtScheduled(info.alreadyScheduled)}
            </p>
            <button onClick={() => setShowPicker(true)} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)',
              borderRadius: 8, padding: '10px 20px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
            }}>
              Choisir un autre créneau
            </button>
          </div>
        ) : (
          <CallSlotPicker
            kind={info.kind}
            token={token}
            firstName={info.firstName}
            subtitle={(TOPIC_SUBTITLE[info.kind] || TOPIC_SUBTITLE.mariage)(info.firstName)}
            onBooked={() => setBooked(true)}
          />
        )}
      </div>
    </div>
  );
}
