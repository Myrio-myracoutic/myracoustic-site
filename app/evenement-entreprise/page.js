'use client';

import { useState } from 'react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';

/* ─── Placeholder image ───────────────────────────────────────── */
function ImgPh({ label, gradient, style }) {
  return (
    <div style={{
      background: gradient, borderRadius: 12, minHeight: 160,
      display: 'flex', alignItems: 'flex-end',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(255,255,255,0.018) 18px,rgba(255,255,255,0.018) 36px)',
      }} />
      <span style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 10,
        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em',
        textTransform: 'uppercase', padding: '10px 14px', zIndex: 1,
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Carte offre ─────────────────────────────────────────────── */
function OfferCard({ icon, title, desc, tags }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#111e2d' : 'var(--card)',
        border: `1px solid ${hov ? 'var(--indigo-vif)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, padding: '32px 28px', transition: 'all 0.28s',
        transform: hov ? 'translateY(-4px)' : 'none',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 22, fontWeight: 700, marginBottom: 10,
      }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 14, lineHeight: 1.75, marginBottom: 18 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tags.map((t) => (
          <span key={t} style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 11, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 9px', borderRadius: 4,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Widget RDV (calendrier simulé) ─────────────────────────── */
const AVAILABLE_DAYS = [3, 4, 5, 10, 11, 12, 16, 17, 18, 23, 24, 25];
const SLOTS = {
  3:  ['10:00', '14:00', '16:00'],
  4:  ['09:30', '11:00'],
  5:  ['14:00', '16:30'],
  10: ['09:00', '11:00', '15:00'],
  11: ['10:00', '14:30'],
  12: ['09:00', '13:00'],
  16: ['09:30', '11:00', '14:00', '16:30'],
  17: ['10:00', '15:00'],
  18: ['09:00', '13:00', '16:00'],
  23: ['10:00', '14:00'],
  24: ['09:30', '11:30', '15:00'],
  25: ['10:00', '14:00', '16:00'],
};
/* Juin 2026 commence un lundi — 2 cases vides avant le 1er */
const JUNE_DAYS = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

function RdvWidget() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div style={{
        padding: '40px 24px', textAlign: 'center',
        border: '1px solid rgba(184,239,11,0.3)', borderRadius: 12,
        background: 'rgba(184,239,11,0.04)',
      }}>
        <AnimatedWave bars={24} height={40} style={{ marginBottom: 16 }} />
        <p style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontWeight: 700, fontSize: 18, marginBottom: 8,
        }}>RDV confirmé !</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Un conseiller Myracoustic vous contactera le {selectedDate} juin à {selectedSlot}.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14, overflow: 'hidden', background: '#fff',
    }}>
      {/* Header */}
      <div style={{
        background: '#0d1b2a', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <img src="/logo.png" alt="Myracoustic" style={{ height: 28 }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontWeight: 700, fontSize: 13, color: 'white',
          }}>Myracoustic · Entretien conseil</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            30 min · Visio ou téléphone
          </div>
        </div>
      </div>

      {/* Corps calendrier */}
      <div style={{ background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation mois */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <button style={{
            background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
            width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#374151',
          }}>‹</button>
          <span style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontWeight: 700, fontSize: 14, color: '#111827',
          }}>Juin 2026</span>
          <button style={{
            background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
            width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#374151',
          }}>›</button>
        </div>

        {/* En-têtes jours */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
          padding: '8px 20px 4px', gap: 2,
        }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: '#9ca3af', fontFamily: 'var(--font-display), sans-serif',
            }}>{d}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
          padding: '4px 20px 8px', gap: 3,
        }}>
          {JUNE_DAYS.map((d, i) => {
            const avail = d && AVAILABLE_DAYS.includes(d);
            const isSelected = d === selectedDate;
            return (
              <div
                key={i}
                onClick={() => { if (avail) { setSelectedDate(d); setSelectedSlot(null); } }}
                style={{
                  textAlign: 'center', padding: '7px 0', borderRadius: 8,
                  fontSize: 12, fontWeight: avail ? 600 : 400,
                  color: !d ? 'transparent' : isSelected ? '#fff' : avail ? '#1a2260' : '#d1d5db',
                  background: isSelected ? '#1a2260' : avail ? 'rgba(26,34,96,0.09)' : 'transparent',
                  cursor: avail ? 'pointer' : 'default', transition: 'all 0.15s',
                  fontFamily: 'var(--font-display), sans-serif',
                  outline: isSelected ? '2px solid #343790' : 'none',
                }}
              >
                {d || ''}
              </div>
            );
          })}
        </div>

        {/* Créneaux */}
        {selectedDate && SLOTS[selectedDate] && (
          <div style={{ padding: '0 20px 14px' }}>
            <div style={{
              fontSize: 11, color: '#6b7280', marginBottom: 8,
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
            }}>
              Créneaux — {selectedDate} juin 2026
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SLOTS[selectedDate].map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '7px 14px', borderRadius: 6, fontSize: 13,
                    fontWeight: 600, fontFamily: 'var(--font-display), sans-serif',
                    cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: selectedSlot === slot ? '#1a2260' : '#fff',
                    color: selectedSlot === slot ? '#fff' : '#1a2260',
                    outline: `1px solid ${selectedSlot === slot ? '#1a2260' : '#d1d5db'}`,
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bouton de confirmation */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #e5e7eb', textAlign: 'center',
        }}>
          {selectedSlot ? (
            <button
              onClick={() => setConfirmed(true)}
              style={{
                background: '#1a2260', color: '#fff', border: 'none', cursor: 'pointer',
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-display), sans-serif', width: '100%',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Confirmer le {selectedDate} juin à {selectedSlot} →
            </button>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', background: '#f3f4f6', borderRadius: 20,
              fontSize: 11, color: '#374151',
              fontFamily: 'var(--font-display), sans-serif',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Sélectionnez un jour · Fuseau Paris (UTC+2)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Données ───────────────────────────────────────────────────── */
const OFFERS = [
  {
    icon: '🎙️',
    title: 'Séminaires & Conférences',
    desc: 'Sonorisation et vidéo adaptées aux grandes salles de conférence, amphithéâtres et espaces corporate. Technique invisible, impact maximal.',
    tags: ['Micro HF', 'Écrans LED', 'Retransmission', 'Visio'],
  },
  {
    icon: '🥂',
    title: 'Galas & Soirées de prestige',
    desc: 'Ambiances lumineuses haut de gamme, animation DJ professionnelle et vidéo pour des soirées entreprise mémorables et racées.',
    tags: ['Lumières show', 'DJ', 'Vidéo mapping', 'Animation'],
  },
  {
    icon: '🏢',
    title: 'Événements corporate',
    desc: "Team building, lancement de produit, afterwork — nous gérons l'intégralité de la technique pour que vous vous consacriez à l'essentiel.",
    tags: ['Son', 'Lumières', 'Vidéo', 'Clé en main'],
  },
];

/* ─── Formulaire de contact ─────────────────────────────────────── */
const INPUT_STYLE = {
  width: '100%', padding: '12px 15px',
  background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-body), sans-serif', transition: 'border-color 0.2s',
};

function ContactForm() {
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', tel: '',
    societe: '', type: '', effectif: '', message: '',
  });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const focus = (e) => { e.target.style.borderColor = 'var(--indigo-vif)'; };
  const blur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  if (sent) {
    return (
      <div style={{
        padding: '40px 24px',
        background: 'rgba(52,55,144,0.08)',
        border: '1px solid rgba(52,55,144,0.4)',
        borderRadius: 12, textAlign: 'center',
      }}>
        <AnimatedWave bars={24} height={40} style={{ marginBottom: 16 }} />
        <p style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontWeight: 700, fontSize: 18, marginBottom: 8,
        }}>Message envoyé !</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Nous vous répondons sous 24h ouvrées.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input placeholder="Prénom" value={form.prenom} onChange={set('prenom')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
        <input placeholder="Nom" value={form.nom} onChange={set('nom')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
      </div>
      <input placeholder="Email professionnel" type="email" value={form.email} onChange={set('email')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input placeholder="Téléphone" value={form.tel} onChange={set('tel')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
        <input placeholder="Société" value={form.societe} onChange={set('societe')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <select
          value={form.type} onChange={set('type')}
          style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', color: form.type ? 'white' : 'rgba(255,255,255,0.35)' }}
          onFocus={focus} onBlur={blur}
        >
          <option value="" disabled>Type d'événement</option>
          {["Séminaire", "Gala", "Soirée d'entreprise", "Lancement produit", "Autre"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input placeholder="Effectif estimé" value={form.effectif} onChange={set('effectif')} style={INPUT_STYLE} onFocus={focus} onBlur={blur} />
      </div>
      <textarea
        placeholder="Décrivez votre projet..."
        value={form.message} onChange={set('message')}
        rows={4}
        style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
        onFocus={focus} onBlur={blur}
      />
      <button
        onClick={() => setSent(true)}
        style={{
          background: 'var(--indigo-vif)', color: 'white', border: 'none', cursor: 'pointer',
          padding: '14px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700,
          fontFamily: 'var(--font-display), sans-serif', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#5558d4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--indigo-vif)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Envoyer ma demande →
      </button>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function EntreprisesPage() {
  return (
    <div style={{ paddingTop: 70 }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(80px,10vw,120px)',
        background: 'linear-gradient(135deg,var(--bg) 0%,#0d1845 55%,var(--bg) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 85% 40%,rgba(52,55,144,0.35) 0%,transparent 60%)',
        }} />

        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 48, alignItems: 'center', position: 'relative', zIndex: 1,
        }}>
          {/* Texte */}
          <div>
            <SectionLabel>Entreprises</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(40px,7vw,90px)', fontWeight: 700,
              lineHeight: 0.93, letterSpacing: '-0.025em', marginBottom: 24,
            }}>
              L'ÉVÉNEMENT<br />
              <span style={{ color: 'var(--lime)' }}>À VOTRE</span><br />
              IMAGE
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.56)',
              fontSize: 'clamp(14px,1.5vw,17px)', lineHeight: 1.75,
              maxWidth: 460, marginBottom: 36,
            }}>
              Séminaires, galas, soirées d'entreprise — notre équipe technique assure une exécution irréprochable pour que vous vous consacriez à l'essentiel.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#contact-form" style={{
                background: 'var(--indigo-vif)', color: 'white',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700,
                fontFamily: 'var(--font-display), sans-serif',
                textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#5558d4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--indigo-vif)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Nous contacter →
              </a>
              <a href="#rdv" style={{
                background: 'transparent', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                fontFamily: 'var(--font-display), sans-serif',
                textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Prendre un RDV
              </a>
            </div>
          </div>

          {/* Photos placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ImgPh
              label="Gala d'entreprise · Salle de prestige"
              gradient="linear-gradient(135deg,#0d1845 0%,#343790 60%,#0d1b2a 100%)"
              style={{ height: 200 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ImgPh
                label="Séminaire · Amphi 300 pers."
                gradient="linear-gradient(135deg,#0a1520 0%,#1a3a6a 60%,#0d1b2a 100%)"
                style={{ height: 120 }}
              />
              <ImgPh
                label="Soirée corporate · DJ live"
                gradient="linear-gradient(135deg,#1a0a3d 0%,#5b21b6 60%,#0d2a3d 100%)"
                style={{ height: 120 }}
              />
            </div>
          </div>
        </div>

        {/* Onde décorative */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, zIndex: 2 }}>
          <AnimatedWave bars={56} height={70} opacity={0.55} />
        </div>
      </section>

      {/* ── OFFRES ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Nos offres entreprises</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 44,
          }}>
            Une solution pour chaque <span style={{ color: 'var(--lime)' }}>occasion</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {OFFERS.map((o) => <OfferCard key={o.title} {...o} />)}
          </div>
        </div>
      </section>

      {/* ── RÉFÉRENCE ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Références</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(22px,3vw,38px)', fontWeight: 700, marginBottom: 12,
          }}>
            Ils nous font confiance
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, marginBottom: 44 }}>
            Nos références entreprises sont disponibles sur demande. Voici un exemple de collaboration récente.
          </p>

          {/* Carte référence Keolis Littoral */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: 24, maxWidth: 760,
          }}>
            <div style={{
              border: '1px solid rgba(52,55,144,0.4)',
              borderRadius: 16, padding: '32px 28px',
              background: 'linear-gradient(135deg,rgba(52,55,144,0.08) 0%,rgba(13,27,42,0) 100%)',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(52,55,144,0.15)',
                border: '1px solid rgba(52,55,144,0.3)',
                padding: '5px 14px', borderRadius: 20, marginBottom: 20,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--indigo-vif)' }} />
                <span style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                }}>Référence vérifiée</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 22, fontWeight: 700, marginBottom: 8,
              }}>Keolis Littoral</div>
              <div style={{
                color: 'rgba(255,255,255,0.38)', fontSize: 12,
                fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 16,
              }}>
                Transport public · Groupe international
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.75 }}>
                Prestation technique complète — sonorisation, éclairage et animation pour événement d'entreprise.
              </p>
            </div>

            {/* Carte "autres références" */}
            <div style={{
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '32px 28px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              textAlign: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontWeight: 600, fontSize: 16, marginBottom: 4,
              }}>Autres références</div>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
                Communiquées sur demande lors de l'entretien de qualification.
              </p>
              <a href="#contact-form" style={{
                marginTop: 8, fontSize: 13, fontWeight: 600,
                color: 'var(--indigo-vif)', textDecoration: 'none',
                fontFamily: 'var(--font-display), sans-serif',
                borderBottom: '1px solid rgba(66,69,184,0.4)', paddingBottom: 1,
              }}>
                Nous contacter →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT + RDV ───────────────────────────────────────── */}
      <section id="contact-form" style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: 48,
        }}>
          {/* Formulaire */}
          <div>
            <SectionLabel>Contact</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, marginBottom: 28,
            }}>
              Parlons de votre <span style={{ color: 'var(--lime)' }}>projet</span>
            </h2>
            <ContactForm />
          </div>

          {/* RDV */}
          <div id="rdv">
            <SectionLabel>Prise de RDV</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 700, marginBottom: 8,
            }}>
              Échangez avec un <span style={{ color: 'var(--lime)' }}>conseiller</span>
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, marginBottom: 20,
            }}>
              Réservez un appel de 30 min avec notre équipe — directement dans votre agenda.
            </p>
            <RdvWidget />
          </div>
        </div>
      </section>

    </div>
  );
}
