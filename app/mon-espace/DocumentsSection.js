'use client';
import { FileText, ExternalLink } from 'lucide-react';

export default function DocumentsSection({ ev }) {
  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '0 0 20px',
      }}>Documents</h3>

      {ev.qonto_quote_url ? (
        <a
          href={ev.qonto_quote_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '16px 20px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,239,11,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={20} color="#b8ef0b" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>
                Devis Myracoustic
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                Cliquez pour consulter ou télécharger
              </div>
            </div>
            <ExternalLink size={16} color="rgba(255,255,255,0.3)" />
          </div>
        </a>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic' }}>
          Aucun document disponible pour le moment.
        </p>
      )}
    </div>
  );
}
