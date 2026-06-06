'use client';

const WAVE_COLORS = [
  '#8b2be2','#6633dd','#3a54d6','#2278e8','#059de8',
  '#0bbcd4','#0db890','#3eb846','#84c420','#b8ef0b',
  '#e8c60a','#f5a623','#f97316','#ef4444','#e9258c','#b026d9',
];

function getBarH(i, total) {
  const center = total * 0.52;
  const dist = Math.abs(i - center) / (total * 0.5);
  const envelope = Math.max(0.12, 1 - dist * 1.15);
  const noise = 0.35 + Math.abs(Math.sin(i * 1.8 + 0.4)) * 0.65;
  return envelope * noise;
}

export function AnimatedWave({ bars = 48, height = 100, style = {}, opacity = 1, mirrored = false }) {
  const renderBars = (flip = false) => (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%',
      transform: flip ? 'scaleY(-1)' : 'none', transformOrigin: 'bottom',
    }}>
      {Array.from({ length: bars }).map((_, i) => {
        const ci = Math.floor((i / bars) * WAVE_COLORS.length);
        const h = Math.max(8, getBarH(i, bars) * 94);
        const dur = 0.42 + (i % 9) * 0.09;
        const delay = -(i * 0.065) % 1.6;
        return (
          <div key={i} style={{
            flex: '1 0 0', maxWidth: 10,
            background: WAVE_COLORS[ci],
            borderRadius: flip ? '0 0 3px 3px' : '3px 3px 0 0',
            height: `${h}%`,
            transformOrigin: flip ? 'top' : 'bottom',
            animation: `waveBar ${dur}s ease-in-out ${delay}s infinite alternate`,
          }} />
        );
      })}
    </div>
  );

  if (mirrored) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height, opacity, ...style }}>
        <div style={{ flex: 1 }}>{renderBars(true)}</div>
        <div style={{ flex: 1 }}>{renderBars(false)}</div>
      </div>
    );
  }
  return (
    <div style={{ height, opacity, display: 'flex', justifyContent: 'center', ...style }}>
      <div style={{ width: '100%', height: '100%' }}>{renderBars(false)}</div>
    </div>
  );
}

export function WaveBullet({ size = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: size, flexShrink: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const ci = Math.floor((i / 9) * WAVE_COLORS.length);
        const h = 20 + Math.abs(Math.sin(i * 1.1 + 0.5)) * 80;
        const dur = 0.38 + (i % 5) * 0.11;
        const delay = -(i * 0.09) % 1.1;
        return (
          <div key={i} style={{
            width: 2, background: WAVE_COLORS[ci], borderRadius: 1,
            height: `${h}%`, transformOrigin: 'bottom',
            animation: `waveBar ${dur}s ease-in-out ${delay}s infinite alternate`,
          }} />
        );
      })}
    </div>
  );
}

export function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, ...style }}>
      <WaveBullet size={15} />
      <span style={{
        fontFamily: "var(--font-display), sans-serif",
        fontSize: 12, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--lime)',
      }}>
        {children}
      </span>
    </div>
  );
}
