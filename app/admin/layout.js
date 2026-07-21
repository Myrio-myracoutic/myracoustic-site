'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, FileText, Users, LogOut, CalendarDays, UserSearch, Heart } from 'lucide-react';

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: "Vue d'ensemble",  exact: true },
  { href: '/admin/leads-mariage', icon: Heart,          label: 'Leads mariage' },
  { href: '/admin/evenements',   icon: FileText,        label: 'Événements' },
  { href: '/admin/planification', icon: CalendarDays,   label: 'Planification' },
  { href: '/admin/prospects',    icon: UserSearch,      label: 'Prospects' },
  { href: '/admin/clients',      icon: Users,           label: 'Clients' },
];

function NavItem({ href, icon: Icon, label, exact }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px',
      borderRadius: 9, textDecoration: 'none', marginBottom: 2,
      background: active ? 'rgba(184,239,11,0.12)' : 'transparent',
      color: active ? '#b8ef0b' : 'rgba(255,255,255,0.5)',
      fontSize: 14, fontFamily: 'var(--font-display), sans-serif',
      fontWeight: active ? 600 : 400, transition: 'all 0.15s',
      borderLeft: `3px solid ${active ? '#b8ef0b' : 'transparent'}`,
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
    >
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body), sans-serif' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#060e16', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 12px', display: 'flex', justifyContent: 'center' }}>
          <a href="/"><Image src="/logo.png" alt="Myracoustic" width={140} height={48} style={{ height: 48, width: 'auto' }} /></a>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            background: 'rgba(184,239,11,0.1)', color: '#b8ef0b',
            border: '1px solid rgba(184,239,11,0.18)', borderRadius: 5,
            padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
          }}>ADMIN</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em', padding: '0 6px', marginBottom: 8 }}>MENU</p>
          {NAV.map(n => <NavItem key={n.href} {...n} />)}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '9px 14px', color: 'rgba(255,255,255,0.35)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
          }}>
            <LogOut size={15} strokeWidth={1.8} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, marginLeft: 240, background: '#060e16', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
