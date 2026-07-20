import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Phone, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import FormulesSection from '../../../components/FormulesSection';
import PlateformeSection from '../../../components/PlateformeSection';

const REASSURANCE = [
  [ShieldCheck, 'Gratuit & sans engagement', 'Recevez votre devis en quelques minutes, sans aucune obligation.'],
  [CreditCard, 'Réglez en deux fois', '60 % à la signature, 40 % le jour J — pour étaler sereinement.'],
  [Phone, 'Un conseiller vous rappelle', 'Sous 24h, pour affiner et finaliser votre devis avec vous.'],
  [Sparkles, 'Entièrement personnalisable', 'Cérémonie, mur LED, karaoké, heures en plus… vous composez.'],
];

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

      {/* Valeur + réassurance — vendre l'expérience avant d'afficher les prix */}
      <section style={{ padding: 'clamp(44px,6vw,76px) 32px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(27px,3.8vw,44px)', fontWeight: 700, textAlign: 'center', lineHeight: 1.12, marginBottom: 16 }}>
            Votre mariage mérite <span style={{ color: 'var(--lime)' }}>une équipe complète</span>, pas juste un DJ
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px,1.6vw,17px)', lineHeight: 1.7, textAlign: 'center', maxWidth: 690, margin: '0 auto 40px' }}>
            Son, lumière, vidéo et DJ réunis par une seule équipe, un espace en ligne pour tout organiser à deux, et un conseiller qui vous accompagne du devis au dernier slow. Chaque formule est un point de départ — vous l'ajustez à vos envies.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
            {REASSURANCE.map(([Icon, title, desc], i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 18px' }}>
                <Icon size={19} color="var(--lime)" strokeWidth={1.8} style={{ marginBottom: 10 }} />
                <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FormulesSection />
      <PlateformeSection />
    </div>
  );
}
