'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatedWave } from './AnimatedWave';

const SERVICES = ['Sonorisation', 'Éclairage', 'Vidéo & Mapping', 'Animation DJ'];

const NAV_LINKS = [
  { href: '/',                    label: 'Accueil' },
  { href: '/evenements-prives',        label: 'Particuliers' },
  { href: '/evenement-entreprise',         label: 'Entreprises' },
  { href: '/evenements-prives/devis',  label: 'Devis en ligne' },
];

const LEGAL_LINKS = [
  { href: '/mentions-legales',           label: 'Mentions légales' },
  { href: '/cgv',                        label: 'Conditions générales' },
  { href: '/politique-confidentialite',  label: 'Politique de confidentialité' },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/evenements-prives/devis')) return null;
  return (
    <footer style={{
      background: '#060e16',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '56px 32px 28px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 40, marginBottom: 48,
        }}>
          {/* Colonne marque */}
          <div>
            <Image src="/logo.png" alt="Myracoustic" width={160} height={44} style={{ height: 44, width: 'auto', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.8, maxWidth: 240 }}>
              Prestataire événementiel premium. Son, lumière, vidéo et DJ pour mariages et événements professionnels.
            </p>
          </div>

          {/* Services */}
          <div>
            <h5 style={{
              fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--lime)', marginBottom: 16,
              fontFamily: "var(--font-mono), monospace",
            }}>
              Services
            </h5>
            {SERVICES.map((s) => (
              <p key={s} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9 }}>{s}</p>
            ))}
          </div>

          {/* Navigation */}
          <div>
            <h5 style={{
              fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--lime)', marginBottom: 16,
              fontFamily: "var(--font-mono), monospace",
            }}>
              Naviguer
            </h5>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h5 style={{
              fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--lime)', marginBottom: 16,
              fontFamily: "var(--font-mono), monospace",
            }}>
              Contact
            </h5>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9 }}>
              📍 Nort-sur-Erdre — Loire-Atlantique
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9 }}>
              📞 07 68 53 33 08
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9 }}>
              ✉️ contact@myracoustic.com
            </p>
          </div>
        </div>

        {/* Bas de page */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, whiteSpace: 'nowrap' }}>
              © 2026 Myracoustic.
            </p>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={{
                color: 'rgba(255,255,255,0.22)', fontSize: 12,
                textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.12)',
                transition: 'color 0.2s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <AnimatedWave bars={28} height={28} opacity={0.5} />
        </div>
      </div>
    </footer>
  );
}
