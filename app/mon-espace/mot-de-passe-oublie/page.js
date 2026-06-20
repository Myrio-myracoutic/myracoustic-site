'use client';
import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15,
  fontFamily: 'inherit', outline: 'none', marginBottom: 16,
};

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback?type=recovery`,
    });
    setLoading(false);
    if (err) { setError('Erreur lors de l\'envoi. Vérifiez votre adresse email.'); return; }
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
            }}>Email envoyé</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
              Un lien de réinitialisation a été envoyé à{' '}
              <strong style={{ color: '#fff' }}>{email}</strong>.{' '}
              Il est valable 1 heure.
            </p>
            <a href="/mon-espace/connexion" style={{
              display: 'inline-block', marginTop: 24,
              color: 'rgba(184,239,11,0.7)', fontSize: 13, textDecoration: 'none',
            }}>
              ← Retour à la connexion
            </a>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 700,
              color: '#fff', marginBottom: 8,
            }}>Mot de passe oublié</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Entrez votre email — vous recevrez un lien pour choisir un nouveau mot de passe.
            </p>

            {error && (
              <p style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20,
              }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
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
                style={{
                  width: '100%', background: '#b8ef0b', color: '#060e16',
                  border: 'none', borderRadius: 8, padding: '13px 0',
                  fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20 }}>
              <a href="/mon-espace/connexion" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none' }}>
                ← Retour à la connexion
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
