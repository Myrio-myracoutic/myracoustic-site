'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import PasswordInput from '@/app/components/PasswordInput';

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

function PasswordForm({ initialError }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError('Email ou mot de passe incorrect. Utilisez « Mot de passe oublié ? » pour en définir un nouveau.');
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
        type="email" required placeholder="votre@email.fr" autoComplete="email"
        value={email} onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
        Mot de passe
      </label>
      <PasswordInput
        required value={password} onChange={e => setPassword(e.target.value)}
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
    ? 'Ce lien a expiré. Connectez-vous avec votre mot de passe, ou utilisez « Mot de passe oublié ? ».'
    : '';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/ban_connect.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Voile sombre */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,14,22,0.70)', zIndex: 0 }} />
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
          color: '#fff', marginBottom: 8,
        }}>Mon espace</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 24 }}>
          Connectez-vous avec l’email et le mot de passe reçus lors de votre demande de devis.
        </p>

        <PasswordForm initialError={initialError} />
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
