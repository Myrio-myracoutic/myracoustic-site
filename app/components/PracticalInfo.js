'use client';
import { MapPin, BedDouble, Car, Clock, Info, Navigation } from 'lucide-react';

/* Cartes texte prédéfinies (clé ↔ libellé ↔ icône). L'ordre = ordre d'affichage. */
export const PRACTICAL_CARDS = [
  { key: 'access',        label: 'Accès & parking', icon: MapPin },
  { key: 'accommodation', label: 'Hébergement',     icon: BedDouble },
  { key: 'carpool',       label: 'Covoiturage',     icon: Car },
  { key: 'other',         label: 'Bon à savoir',    icon: Info },
];

/* Y a-t-il au moins une info pratique remplie ? */
export function hasPracticalInfo(info) {
  if (!info || typeof info !== 'object') return false;
  const textFilled = PRACTICAL_CARDS.some(c => (info[c.key] || '').trim());
  const addressFilled = (info.address || '').trim();
  const scheduleFilled = Array.isArray(info.schedule) && info.schedule.some(s => (s.time || '').trim() || (s.label || '').trim());
  return !!(textFilled || addressFilled || scheduleFilled);
}

function Card({ icon: Icon, label, children }) {
  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={16} color="#b8ef0b" strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

const cardText = { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' };

/* Affichage côté invité (et aperçu couple) — ne rend rien si vide */
export default function PracticalInfoCards({ info }) {
  if (!hasPracticalInfo(info)) return null;

  const schedule = (Array.isArray(info.schedule) ? info.schedule : [])
    .filter(s => (s.time || '').trim() || (s.label || '').trim());
  const address = (info.address || '').trim();
  const accessText = (info.access || '').trim();
  const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 800,
        color: '#fff', margin: '0 0 14px',
      }}>Infos pratiques</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Horaires clés en premier */}
        {schedule.length > 0 && (
          <Card icon={Clock} label="Horaires clés">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 14, alignItems: 'baseline' }}>
                  <span style={{ color: '#b8ef0b', fontWeight: 700, minWidth: 52, fontFamily: 'var(--font-display), sans-serif' }}>{s.time || '—'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Accès & parking (+ itinéraire si adresse) */}
        {(accessText || mapsUrl) && (
          <Card icon={MapPin} label="Accès & parking">
            {accessText && <p style={cardText}>{accessText}</p>}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: accessText ? 12 : 0,
                background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.3)',
                borderRadius: 8, padding: '7px 14px', color: '#b8ef0b', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-display), sans-serif', textDecoration: 'none',
              }}>
                <Navigation size={13} /> Itinéraire
              </a>
            )}
          </Card>
        )}

        {/* Autres cartes texte */}
        {PRACTICAL_CARDS.filter(c => c.key !== 'access').map(c => {
          const text = (info[c.key] || '').trim();
          if (!text) return null;
          return (
            <Card key={c.key} icon={c.icon} label={c.label}>
              <p style={cardText}>{text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
