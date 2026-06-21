'use client';
import { Phone, Mail, Clock, MessageCircle } from 'lucide-react';

const ITEMS = [
  {
    icon: Phone,
    label: 'Téléphone',
    value: '07 68 53 33 08',
    href: 'tel:+33768533308',
    sub: 'Disponible 7j/7 pour vos événements',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@myracoustic.com',
    href: 'mailto:contact@myracoustic.com',
    sub: 'Réponse sous 24h',
  },
];

export default function ContactSection() {
  return (
    <div>
      <div style={{
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '24px 28px', marginBottom: 16,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
          margin: '0 0 6px',
        }}>Nous contacter</h3>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Une question, un imprévu, un changement de dernière minute ? Contactez-nous directement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ITEMS.map(({ icon: Icon, label, value, href, sub }) => (
            <a key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '18px 20px', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,239,11,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color="#b8ef0b" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3, fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display), sans-serif' }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Horaires */}
      <div style={{
        background: 'rgba(184,239,11,0.05)', border: '1px solid rgba(184,239,11,0.15)',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <Clock size={18} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#b8ef0b', marginBottom: 4, fontFamily: 'var(--font-display), sans-serif' }}>
            Disponibilité
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            Nous sommes joignables 7j/7. Pour les urgences le jour de votre événement, appelez directement au <strong style={{ color: '#fff' }}>07 68 53 33 08</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FloatingContact({ activeSection }) {
  if (activeSection === 'contact') return null;
  return (
    <a
      href="tel:+33768533308"
      title="Appeler Myracoustic"
      className="floating-contact"
      style={{
        position: 'fixed', zIndex: 200,
        width: 52, height: 52, borderRadius: '50%',
        background: '#b8ef0b', color: '#060e16',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(184,239,11,0.35)',
        textDecoration: 'none', transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Phone size={22} strokeWidth={2} />
    </a>
  );
}
