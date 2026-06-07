'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const LINKS = [
  { href: '/',              label: 'Accueil' },
  { href: '/entreprises',   label: 'Entreprises' },
  { href: '/particuliers',  label: 'Particuliers' },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  if (pathname.startsWith('/particuliers/devis')) return null;

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(13,27,42,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
      transition: 'all 0.35s ease',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/logo.png" alt="Myracoustic" width={160} height={54} style={{ height: 54, width: 'auto' }} priority />
        </Link>

        {/* Liens desktop */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{
              color: isActive(l.href) ? 'var(--lime)' : 'rgba(255,255,255,0.75)',
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 500, fontSize: 15,
              padding: '6px 0', position: 'relative',
              transition: 'color 0.2s',
              textDecoration: 'none',
            }}>
              {l.label}
              {isActive(l.href) && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, background: 'var(--lime)', borderRadius: 1,
                }} />
              )}
            </Link>
          ))}
          <Link href="/particuliers/devis" style={{
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '10px 20px', borderRadius: 6, fontSize: 14,
            fontWeight: 700, fontFamily: "var(--font-display), sans-serif",
            transition: 'background 0.2s',
            textDecoration: 'none',
            display: 'inline-block',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ceff2a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime)'; }}
          >
            Demander un devis
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          className="hide-desktop"
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22, padding: 4 }}
          aria-label="Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div style={{
          background: 'rgba(13,27,42,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 32px 24px',
        }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              color: isActive(l.href) ? 'var(--lime)' : 'rgba(255,255,255,0.8)',
              fontFamily: "var(--font-display), sans-serif", fontWeight: 500, fontSize: 16,
              padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
          <Link href="/particuliers/devis" onClick={() => setOpen(false)} style={{
            display: 'block', marginTop: 16, width: '100%',
            background: 'var(--lime)', color: '#0d1b2a',
            padding: '13px 0', borderRadius: 6, fontSize: 15, fontWeight: 700,
            textAlign: 'center', textDecoration: 'none',
            fontFamily: "var(--font-display), sans-serif",
          }}>
            Demander un devis
          </Link>
        </div>
      )}
    </nav>
  );
}
