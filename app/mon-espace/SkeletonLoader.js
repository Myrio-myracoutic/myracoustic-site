'use client';

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .skeleton-block {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }
`;

function Block({ width = '100%', height = 14, style = {} }) {
  return (
    <>
      <style>{SHIMMER}</style>
      <div className="skeleton-block" style={{ width, height, ...style }} />
    </>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <style>{SHIMMER}</style>
      {/* Titre section */}
      <Block width={120} height={11} style={{ marginBottom: 20 }} />
      {/* Lignes de contenu */}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div className="skeleton-block" style={{ width: 52, height: 13, borderRadius: 4 }} />
          <div className="skeleton-block" style={{ flex: 1, height: 13, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPlaylist({ count = 3 }) {
  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '24px 28px',
    }}>
      <style>{SHIMMER}</style>
      <Block width={160} height={11} style={{ marginBottom: 20 }} />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', marginBottom: 8,
          background: 'rgba(255,255,255,0.03)', borderRadius: 10,
        }}>
          <div className="skeleton-block" style={{ width: 16, height: 16, borderRadius: '50%' }} />
          <div className="skeleton-block" style={{ flex: 1, height: 13 }} />
          <div className="skeleton-block" style={{ width: 50, height: 11 }} />
        </div>
      ))}
    </div>
  );
}

export default Block;
