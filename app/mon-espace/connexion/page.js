'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';

function ConnexionForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(params.get('error') === 'lien_invalide'
    ? 'Ce lien a expiré. Demandez-en un nouveau ci-dessous.'
    : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com'}/auth/callback` },
    });
    setLoading(false);
    if (err) { setError('Adresse introuvable ou erreur. Vérifiez votre email.'); return; }
    setSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#060e16',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <a href="/" style={{ marginBottom: 48 }}>
        <Image src="/logo.png" alt="Myracoustic" width={140} height={48} style={{ height: 40, width: 'auto' }} />
      </a>

      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 40,
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 20, fontWeight: 700,
              color: '#fff', marginBottom: 12,
            }}>Vérifiez vos emails</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
              Un lien de connexion a été envoyé à <strong style={{ color: '#fff' }}>{email}</strong>.
              Cliquez dessus pour accéder à votre espace.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 700,
              color: '#fff', marginBottom: 8,
            }}>Mon espace</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              Entrez l'adresse email utilisée lors de votre demande de devis.
            </p>

            {error && (
              <p style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20,
              }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="votre@email.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15,
                  fontFamily: 'inherit', outline: 'none', marginBottom: 16,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: '#b8ef0b', color: '#060e16',
                  border: 'none', borderRadius: 8, padding: '13px 0',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
              </button>
            </form>
          </>
        )}
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
