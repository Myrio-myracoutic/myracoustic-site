'use client';
import { Headphones, Volume2, Lightbulb, Video, Heart, Wrench, Gift, Minus, Check, CornerDownRight } from 'lucide-react';
import { FORMULES, POLES, FORMULES_CHAPEAU, fmtPrice } from '../lib/formules';
import { SectionLabel } from './AnimatedWave';
import Reveal from './Reveal';

const POLE_ICON = {
  dj: Headphones, son: Volume2, lumiere: Lightbulb, video: Video, ceremonie: Heart, jourJ: Wrench,
};

function FormuleCard({ f }) {
  const featured = f.featured;
  return (
    <div style={{
      position: 'relative',
      background: featured ? 'linear-gradient(180deg, rgba(184,239,11,0.07), rgba(184,239,11,0.01))' : 'var(--card)',
      border: `1px solid ${featured ? 'var(--lime)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16, padding: '32px 26px 26px',
      display: 'flex', flexDirection: 'column',
      boxShadow: featured ? '0 14px 44px rgba(184,239,11,0.08)' : 'none',
    }}>
      {f.badge && (
        <span style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--lime)', color: '#0d1b2a', fontFamily: 'var(--font-display), sans-serif',
          fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
        }}>{f.badge}</span>
      )}

      <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 25, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.name}</h3>
      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 18, minHeight: 40 }}>{f.accroche}</p>

      <div style={{ marginBottom: 22 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>à partir de</span>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 40, fontWeight: 800, color: featured ? 'var(--lime)' : '#fff', lineHeight: 1 }}>{fmtPrice(f.price)}</div>
      </div>

      {/* Détail par pôle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 18, flex: 1 }}>
        {POLES.map(p => {
          const Icon = POLE_ICON[p.key];
          const val = f.specs[p.key];
          const empty = !val;
          return (
            <div key={p.key} style={{
              display: 'flex', alignItems: 'flex-start', gap: 11, padding: '9px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: empty ? 0.4 : 1,
            }}>
              <Icon size={17} color={empty ? 'rgba(255,255,255,0.3)' : 'var(--lime)'} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 1 }}>{p.label}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
                  {empty ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.3)' }}><Minus size={12} /> non inclus</span> : val}
                </div>
              </div>
            </div>
          );
        })}

        {/* Cadeau */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0 2px' }}>
          <Gift size={17} color="var(--lime)" strokeWidth={1.7} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Séance de prépa musicale (1h) offerte</span>
        </div>
      </div>

      {/* Espace client — inclus, tout au même endroit */}
      <div style={{
        padding: '13px 15px', borderRadius: 10, marginBottom: 18,
        background: 'rgba(184,239,11,0.06)', border: '1px solid rgba(184,239,11,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--lime)', color: '#0d1b2a', fontFamily: 'var(--font-display), sans-serif',
            fontWeight: 800, fontSize: 10, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4,
          }}><Check size={11} strokeWidth={3} /> INCLUS</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Votre espace de mariage en ligne
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, marginBottom: 7 }}>
          Organisez tout votre mariage au même endroit, à deux — sans surcoût.
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <CornerDownRight size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>{f.platform}</span>
        </div>
      </div>

      <a href={`/devis/mariage/${f.key}`} className={featured ? 'btn-primary' : 'btn-secondary'} style={{ justifyContent: 'center', width: '100%' }}>
        Choisir {f.name}
      </a>
    </div>
  );
}

export default function FormulesSection() {
  return (
    <section style={{ padding: 'clamp(64px,8vw,100px) 32px', background: '#060e16' }}>
      <Reveal style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <SectionLabel style={{ justifyContent: 'center' }}>Nos formules mariage</SectionLabel>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.8vw,46px)', fontWeight: 700, textAlign: 'center', marginBottom: 14, lineHeight: 1.1 }}>
          Une formule, <span style={{ color: 'var(--lime)' }}>tout est clair</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, textAlign: 'center', maxWidth: 620, margin: '0 auto 52px' }}>
          {FORMULES_CHAPEAU}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20, alignItems: 'stretch' }}>
          {FORMULES.map(f => <FormuleCard key={f.key} f={f} />)}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.35)', marginTop: 28, lineHeight: 1.7 }}>
          Prix TTC, à partir de — personnalisez avec vos options (cérémonie laïque, mur LED, karaoké…) à l’étape suivante.
        </p>
      </Reveal>
    </section>
  );
}
