'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';
import { AnimatedWave } from './AnimatedWave';
import { usePathname } from 'next/navigation';

const SERVICES = ['Sonorisation', 'Éclairage', 'Vidéo & Mapping', 'Animation DJ'];

const NAV_LINKS = [
  { href: '/',                     label: 'Accueil' },
  { href: '/evenements-prives',    label: 'Particuliers' },
  { href: '/evenement-entreprise', label: 'Entreprises' },
  { href: '/mariage',              label: 'Mariage' },
];

const CITY_LINKS = [
  { href: '/sonorisation-nantes',      label: 'Nantes' },
  { href: '/sonorisation-angers',      label: 'Angers' },
  { href: '/sonorisation-saint-nazaire', label: 'Saint-Nazaire' },
  { href: '/sonorisation-rennes',      label: 'Rennes' },
  { href: '/dj-mariage-nantes',        label: 'DJ Mariage Nantes' },
  { href: '/dj-mariage-angers',        label: 'DJ Mariage Angers' },
];

const LEGAL_LINKS = [
  { href: '/mentions-legales',           label: 'Mentions légales' },
  { href: '/cgv',                        label: 'Conditions générales' },
  { href: '/politique-confidentialite',  label: 'Politique de confidentialité' },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/mon-espace') || pathname?.startsWith('/auth') || pathname?.startsWith('/devis') || pathname?.startsWith('/admin') || pathname?.startsWith('/invitation')) return null;
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
            <Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.8, maxWidth: 240 }}>
              Prestataire événementiel premium. Son, lumière, vidéo et DJ pour mariages et événements professionnels.
              Basé à Nort-sur-Erdre, intervient sur Nantes, Angers, Rennes, Saint-Nazaire et toute la région Pays de la Loire.
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
            <a href="/devis/particulier" style={{
              display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9,
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              Devis en ligne
            </a>
          </div>

          {/* Zones */}
          <div>
            <h5 style={{
              fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--lime)', marginBottom: 16,
              fontFamily: "var(--font-mono), monospace",
            }}>
              Zones
            </h5>
            {CITY_LINKS.map((l) => (
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
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={13} strokeWidth={1.8} /> Nort-sur-Erdre — Loire-Atlantique
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Phone size={13} strokeWidth={1.8} /> 07 68 53 33 08
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Mail size={13} strokeWidth={1.8} /> contact@myracoustic.com
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
            <Link href="/mon-espace/connexion" style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
              fontFamily: "var(--font-display), sans-serif",
              transition: 'color 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            >
              Espace client
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>·</span>
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
            <button
              onClick={() => window.dispatchEvent(new Event('myra-cookie-prefs'))}
              style={{
                color: 'rgba(255,255,255,0.22)', fontSize: 12, background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.12)',
                transition: 'color 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lime)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; }}
            >
              Préférences cookies
            </button>
          </div>
          <AnimatedWave bars={28} height={28} opacity={0.5} />
        </div>
      </div>
    </footer>
  );
}
