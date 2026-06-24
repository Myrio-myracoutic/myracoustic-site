'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15,
  fontFamily: 'inherit', outline: 'none', marginBottom: 12,
};

const btnPrimary = {
  width: '100%', background: '#b8ef0b', color: '#060e16',
  border: 'none', borderRadius: 8, padding: '13px 0',
  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15,
  cursor: 'pointer',
};

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <p style={{
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20,
    }}>{msg}</p>
  );
}

function MagicLinkForm({ initialError }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${APP_URL}/auth/callback` },
    });
    setLoading(false);
    if (err) { setError('Adresse introuvable ou erreur. Vérifiez votre email.'); return; }
    setSent(true);
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
      <h2 style={{
        fontFamily: 'var(--font-display), sans-serif', fontSize: 18, fontWeight: 700,
        color: '#fff', marginBottom: 12,
      }}>Vérifiez vos emails</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
        Un lien de connexion a été envoyé à{' '}
        <strong style={{ color: '#fff' }}>{email}</strong>.{' '}
        Cliquez dessus pour accéder à votre espace.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBox msg={error} />
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
        Adresse email
      </label>
      <input
        type="email" required placeholder="votre@email.fr"
        value={email} onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <button
        type="submit" disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
      >
        {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError('Email ou mot de passe incorrect. Vous pouvez utiliser le lien par email si vous n\'avez pas encore de mot de passe.');
      return;
    }
    router.replace('/mon-espace');
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBox msg={error} />
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
        Adresse email
      </label>
      <input
        type="email" required placeholder="votre@email.fr"
        value={email} onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
        Mot de passe
      </label>
      <input
        type="password" required placeholder="••••••••"
        value={password} onChange={e => setPassword(e.target.value)}
        style={{ ...inputStyle, marginBottom: 6 }}
      />
      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        <a href="/mon-espace/mot-de-passe-oublie" style={{ color: 'rgba(184,239,11,0.7)', fontSize: 12, textDecoration: 'none' }}>
          Mot de passe oublié ?
        </a>
      </div>
      <button
        type="submit" disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

function ConnexionForm() {
  const params = useSearchParams();
  const initialError = params.get('error') === 'lien_invalide'
    ? 'Ce lien a expiré. Demandez-en un nouveau ci-dessous.'
    : '';
  const [mode, setMode] = useState('magic');

  const tabBase = {
    flex: 1, padding: '10px 0', fontSize: 13,
    fontFamily: 'var(--font-display), sans-serif', fontWeight: 600,
    border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/ban_connect.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Voile sombre */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,14,22,0.72)', zIndex: 0 }} />
      <a href="/" style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto' }} />
      </a>

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(13,27,42,0.92)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 40,
        backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 700,
          color: '#fff', marginBottom: 24,
        }}>Mon espace</h1>

        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4, marginBottom: 28,
        }}>
          <button
            onClick={() => setMode('magic')}
            style={{
              ...tabBase,
              background: mode === 'magic' ? '#b8ef0b' : 'transparent',
              color: mode === 'magic' ? '#060e16' : 'rgba(255,255,255,0.4)',
            }}
          >
            Lien par email
          </button>
          <button
            onClick={() => setMode('password')}
            style={{
              ...tabBase,
              background: mode === 'password' ? '#b8ef0b' : 'transparent',
              color: mode === 'password' ? '#060e16' : 'rgba(255,255,255,0.4)',
            }}
          >
            Mot de passe
          </button>
        </div>

        {mode === 'magic' ? <MagicLinkForm initialError={initialError} /> : <PasswordForm />}
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  );
}
