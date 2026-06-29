'use client';
import { Check, Minus } from 'lucide-react';
import { PLATFORM_PITCH, PLATFORM_FEATURES, FORMULES } from '../lib/formules';
import { SectionLabel } from './AnimatedWave';
import Reveal from './Reveal';

const COLS = FORMULES.map(f => ({ key: f.key, name: f.name, featured: f.featured }));

function Cell({ on, featured }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: featured ? 'rgba(184,239,11,0.04)' : 'transparent',
    }}>
      {on
        ? <Check size={16} color="var(--lime)" strokeWidth={2.5} />
        : <Minus size={14} color="rgba(255,255,255,0.2)" />}
    </div>
  );
}

export default function PlateformeSection() {
  return (
    <section style={{ padding: 'clamp(64px,8vw,100px) 32px' }}>
      <Reveal style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <SectionLabel style={{ justifyContent: 'center' }}>La plateforme incluse</SectionLabel>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.8vw,46px)', fontWeight: 700, textAlign: 'center', marginBottom: 12, lineHeight: 1.1 }}>
          {PLATFORM_PITCH.title.split(' en ligne')[0]} <span style={{ color: 'var(--lime)' }}>en ligne</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15.5, lineHeight: 1.7, textAlign: 'center', maxWidth: 600, margin: '0 auto 44px' }}>
          {PLATFORM_PITCH.subtitle} Vous payez la tranquillité et le contrôle de votre organisation — pas du matériel en plus.
        </p>

        {/* En-tête colonnes */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 58px 58px 58px', gap: 0,
          position: 'sticky', top: 60, zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 12, marginBottom: 4,
          background: 'var(--bg)',
        }}>
          <div />
          {COLS.map(c => (
            <div key={c.key} style={{
              textAlign: 'center', fontFamily: 'var(--font-display), sans-serif',
              fontSize: 12, fontWeight: 700, lineHeight: 1.2,
              color: c.featured ? 'var(--lime)' : 'rgba(255,255,255,0.6)',
            }}>{c.name}</div>
          ))}
        </div>

        {/* Lignes */}
        <div>
          {PLATFORM_FEATURES.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 58px 58px 58px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: 46,
            }}>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', padding: '8px 10px 8px 0', lineHeight: 1.4 }}>{row.label}</div>
              <Cell on={row.essentiel} />
              <Cell on={row.signature} featured />
              <Cell on={row.prestige} />
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.35)', marginTop: 22, lineHeight: 1.7 }}>
          Un seul espace, à deux, du premier brief jusqu’aux photos du lendemain.
        </p>
      </Reveal>
    </section>
  );
}
