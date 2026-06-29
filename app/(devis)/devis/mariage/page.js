import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Phone } from 'lucide-react';
import FormulesSection from '../../../components/FormulesSection';
import PlateformeSection from '../../../components/PlateformeSection';

export const metadata = {
  title: 'Formules mariage — Devis en ligne | Myracoustic',
  description: 'Choisissez votre formule mariage (Essentiel, Signature, Prestige) et obtenez votre devis personnalisé en ligne. Un conseiller vous rappelle sous 24h.',
  robots: { index: false },
};

export default function DevisMariagePage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      {/* En-tête */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'rgba(6,14,22,0.95)', backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <Link href="/mariage" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} priority />
      </div>

      {/* Bandeau rassurance */}
      <div style={{ background: 'rgba(52,55,144,0.12)', borderBottom: '1px solid rgba(52,55,144,0.25)', padding: '12px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>
          <Phone size={15} color="var(--lime)" style={{ flexShrink: 0 }} />
          <span>Devis personnalisé en quelques minutes — <strong style={{ color: '#fff' }}>un conseiller vous rappelle sous 24h</strong> pour le finaliser avec vous.</span>
        </div>
      </div>

      <FormulesSection />
      <PlateformeSection />
    </div>
  );
}
