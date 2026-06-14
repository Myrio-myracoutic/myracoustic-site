'use client';

import { useState } from 'react';
import { AnimatedWave, SectionLabel } from '../components/AnimatedWave';
import { FAQ_ITEMS } from './faq-data';

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
      <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 14, lineHeight: 1.75, marginBottom: tags ? 18 : 0 }}>{desc}</p>
      {tags && (
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
      )}
    </div>
  );
}

/* ─── Pilier technique ────────────────────────────────────────── */
function PillarCard({ icon, title, desc }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '28px 24px',
    }}>
      <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 18, fontWeight: 700, marginBottom: 8,
      }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

/* ─── Étape de méthode ────────────────────────────────────────── */
function StepCard({ num, title, desc }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '26px 24px', position: 'relative',
    }}>
      <span style={{
        fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
        fontSize: 13, color: 'var(--lime)', letterSpacing: '0.1em',
      }}>{num}</span>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif',
        fontSize: 17, fontWeight: 700, margin: '8px 0',
      }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

/* ─── Garantie ────────────────────────────────────────────────── */
function GuaranteeItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0, width: 42, height: 42, borderRadius: 10,
        background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>{icon}</div>
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 16, fontWeight: 700, marginBottom: 4,
        }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 13.5, lineHeight: 1.7 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── FAQ accordéon ───────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${open ? 'var(--lime)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '18px 22px', color: '#fff',
        fontFamily: 'var(--font-display), sans-serif', fontSize: 15, fontWeight: 600,
      }}>
        {q}
        <span style={{
          flexShrink: 0, color: open ? 'var(--lime)' : 'rgba(255,255,255,0.35)',
          fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
        }}>+</span>
      </button>
      {open && (
        <p style={{ margin: 0, padding: '0 22px 20px', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
          {a}
        </p>
      )}
    </div>
  );
}

const EVENT_TYPES = [
  { icon: '🎤', title: 'Séminaires',
    desc: "Une configuration pensée pour les présentations et ateliers : prises de parole multiples, diffusion homogène et intelligible dans toute la salle." },
  { icon: '🏛️', title: 'Conventions',
    desc: 'Un dispositif structuré pour enchaîner les interventions, gérer les transitions et afficher vos contenus en grand format.' },
  { icon: '📊', title: 'Assemblées générales',
    desc: 'Clarté sonore, lisibilité des supports projetés et organisation technique sécurisée pour vos temps forts institutionnels.' },
  { icon: '✂️', title: 'Inaugurations',
    desc: 'Mise en valeur des intervenants et structuration lumineuse adaptée au lieu, pour un moment à la hauteur de l’événement.' },
  { icon: '🚀', title: 'Lancements de produit',
    desc: 'Son, lumière et écran LED coordonnés pour une présentation claire, soignée et impactante.' },
  { icon: '🥂', title: 'Réception corporate',
    desc: 'Une ambiance maîtrisée et une exploitation technique cohérente, sans excès scénographique.' },
  { icon: '🎶', title: "Soirées & galas d'entreprise",
    desc: "Animation musicale par DJ expérimenté, sonorisation adaptée et éclairage scénique pour une soirée festive à l'image de votre structure." },
];

const PILLARS = [
  { icon: '🔊', title: 'Sonorisation', desc: 'Une intelligibilité optimale des prises de parole et une couverture homogène, adaptée à la configuration du lieu.' },
  { icon: '💡', title: 'Éclairage', desc: "Une mise en valeur des intervenants et une structuration visuelle professionnelle de l'espace." },
  { icon: '🖥️', title: 'Écran LED', desc: "Un affichage grand format pour vos supports visuels et votre identité de marque." },
  { icon: '🎚️', title: 'Régie technique', desc: 'Une supervision en temps réel, la gestion des transitions et l’anticipation des imprévus.' },
];

const STEPS = [
  { num: '01', title: 'Analyse & préparation', desc: 'Étude du besoin, cadrage technique et définition du dispositif adapté au lieu et au format de votre événement.' },
  { num: '02', title: 'Repérage technique', desc: 'Validation des accès, des implantations, des alimentations électriques et des contraintes propres au site.' },
  { num: '03', title: 'Installation & contrôles', desc: "Montage sécurisé, tests complets et réglages, réalisés avant l'arrivée des participants." },
  { num: '04', title: 'Exploitation', desc: 'Supervision en temps réel, gestion des transitions et coordination des différentes interventions.' },
  { num: '05', title: 'Démontage', desc: 'Démontage organisé et restitution du site dans le respect des contraintes du lieu.' },
];

const GUARANTEES = [
  { icon: '🤝', title: 'Interlocuteur unique', desc: "Un seul référent pour la préparation, l'exploitation et le suivi de votre événement, du premier échange au démontage." },
  { icon: '📄', title: 'Devis structuré', desc: 'Une proposition détaillée, adaptée au lieu, au format et aux contraintes techniques de votre événement.' },
  { icon: '🛡️', title: 'Assurance professionnelle', desc: 'Une responsabilité civile professionnelle couvrant les activités de sonorisation, éclairage et régie.' },
  { icon: '📍', title: "Zone d'intervention", desc: "Basé à Nort-sur-Erdre, Myracoustic intervient principalement en Pays de la Loire — Nantes, Angers, Rennes, Saint-Nazaire — avec une étude possible au national sur demande." },
];

/* ─── Page ──────────────────────────────────────────────────────── */
export default function EntreprisesPage() {
  return (
    <div style={{ paddingTop: 70 }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,9vw,110px) 32px clamp(80px,10vw,120px)',
        backgroundImage: 'url(/seminaire_myracoustic_nantes.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right,rgba(13,27,42,0.92) 0%,rgba(13,27,42,0.6) 60%,rgba(13,27,42,0.25) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 85% 40%,rgba(52,55,144,0.35) 0%,transparent 60%)',
        }} />

        <div style={{
          maxWidth: 1280, margin: '0 auto',
          position: 'relative', zIndex: 1,
        }}>
          <SectionLabel>Entreprises · 80 à 400 participants</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(40px,7vw,90px)', fontWeight: 700,
            lineHeight: 0.93, letterSpacing: '-0.025em', marginBottom: 24,
          }}>
            UNE TECHNIQUE<br />
            <span style={{ color: 'var(--lime)' }}>À LA HAUTEUR</span><br />
            DE VOS ENJEUX
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.56)',
            fontSize: 'clamp(14px,1.5vw,17px)', lineHeight: 1.75,
            maxWidth: 460, marginBottom: 36,
          }}>
            Myracoustic conçoit et exploite des dispositifs techniques complets — sonorisation, éclairage, écran LED et régie — pour vos événements d'entreprise de 80 à 400 personnes en Pays de la Loire.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://devis.myracoustic.com/professionnel" style={{
              background: 'var(--indigo-vif)', color: 'white',
              padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700,
              fontFamily: 'var(--font-display), sans-serif',
              textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5558d4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--indigo-vif)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Calculer mon devis →
            </a>
          </div>
        </div>

        {/* Onde décorative */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, zIndex: 2 }}>
          <AnimatedWave bars={56} height={70} opacity={0.55} />
        </div>
      </section>

      {/* ── TYPES D'ÉVÉNEMENTS ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Ce que nous accompagnons</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 44,
          }}>
            Des événements <span style={{ color: 'var(--lime)' }}>variés</span>, une exigence constante
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {EVENT_TYPES.map((o) => <OfferCard key={o.title} {...o} />)}
          </div>
        </div>
      </section>

      {/* ── COORDINATION TECHNIQUE ──────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Coordination technique</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
          }}>
            Quatre piliers, un seul <span style={{ color: 'var(--lime)' }}>ensemble cohérent</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 36 }}>
            Pour chaque événement d'entreprise, chaque composante technique est pensée comme un tout, coordonné et supervisé en temps réel.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
            {PILLARS.map((p) => <PillarCard key={p.title} {...p} />)}
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic',
          }}>
            Vidéo uniquement via écran LED — pas de captation, pas de streaming.
          </p>
        </div>
      </section>

      {/* ── MÉTHODE ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Notre méthode</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
          }}>
            Un cadre <span style={{ color: 'var(--lime)' }}>rigoureux</span>, du premier échange au démontage
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 36 }}>
            Une méthode simple et structurée pour préparer, exploiter et sécuriser la technique de votre événement.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
            {STEPS.map((s) => <StepCard key={s.num} {...s} />)}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Anticipation', 'Coordination', 'Exploitation maîtrisée'].map((t) => (
              <span key={t} style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 12, letterSpacing: '0.1em', color: 'var(--lime)',
                border: '1px solid rgba(184,239,11,0.25)', borderRadius: 20,
                padding: '6px 16px',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CADRE PROFESSIONNEL ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionLabel>Un cadre clair</SectionLabel>
          <h2 style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 700, marginBottom: 12,
          }}>
            Une relation <span style={{ color: 'var(--lime)' }}>structurée</span> et transparente
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 36 }}>
            Adaptée aux exigences propres aux événements d'entreprise — un cadre professionnel, sans surprise.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 28, maxWidth: 920,
          }}>
            {GUARANTEES.map((g) => <GuaranteeItem key={g.title} {...g} />)}
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
              <a href="https://devis.myracoustic.com/professionnel" style={{
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

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,7vw,88px) 32px', background: '#060e16' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel style={{ justifyContent: 'center' }}>Questions fréquentes</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 700, marginBottom: 12,
            }}>
              Vous avez des questions ?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
              Les réponses aux interrogations les plus fréquentes sur nos prestations pour événements d'entreprise.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </div>
      </section>

    </div>
  );
}
