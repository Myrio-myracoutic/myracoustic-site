'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace('/admin');
    } else {
      setError('Mot de passe incorrect.');
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#060e16',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'var(--font-body), sans-serif',
    }}>
      <a href="/" style={{ marginBottom: 40 }}>
        <Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto' }} />
      </a>
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 36,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 700,
          color: '#fff', marginBottom: 6,
        }}>Espace admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          Accès réservé à Myracoustic.
        </p>
        {error && (
          <p style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '9px 14px', color: '#f87171', fontSize: 13, marginBottom: 18,
          }}>{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 15,
              fontFamily: 'inherit', outline: 'none', marginBottom: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', background: '#b8ef0b', color: '#060e16',
              border: 'none', borderRadius: 8, padding: '12px 0',
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 14,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.6 : 1,
            }}
          >
            {loading ? 'Connexion…' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  );
}
