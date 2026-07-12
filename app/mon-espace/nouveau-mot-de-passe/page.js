'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import PasswordInput from '@/app/components/PasswordInput';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15,
  fontFamily: 'inherit', outline: 'none', marginBottom: 12,
};

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/mon-espace/connexion?error=lien_invalide');
      } else {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setError('');
    setLoading(true);
    // Définit le mot de passe ET retire le flag must_set_password
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { must_set_password: false },
    });
    setLoading(false);
    if (err) { setError('Erreur lors de la mise à jour. Réessayez ou demandez un nouveau lien.'); return; }
    setDone(true);
    setTimeout(() => router.replace('/mon-espace'), 2000);
  };

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#060e16',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <a href="/" style={{ marginBottom: 48 }}>
        <Image src="/logo.png" alt="Myracoustic" width={180} height={60} style={{ height: 60, width: 'auto' }} />
      </a>

      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 40,
      }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 700,
              color: '#fff', marginBottom: 12,
            }}>Mot de passe mis à jour</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Redirection vers votre espace…
            </p>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 700,
              color: '#fff', marginBottom: 8,
            }}>Nouveau mot de passe</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Choisissez un mot de passe d'au moins 8 caractères.
            </p>

            {error && (
              <p style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20,
              }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
                Nouveau mot de passe
              </label>
              <PasswordInput
                required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
                Confirmer le mot de passe
              </label>
              <PasswordInput
                required autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                style={{ ...inputStyle, marginBottom: 20 }}
              />
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', background: '#b8ef0b', color: '#060e16',
                  border: 'none', borderRadius: 8, padding: '13px 0',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
