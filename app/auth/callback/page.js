'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#060e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, margin: '0 auto 16px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'sans-serif' }}>Connexion en cours…</p>
    </div>
  </div>
);

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const hashError = hashParams.get('error_code');

    // Erreur dans le hash
    if (hashError) {
      router.replace('/mon-espace/connexion?error=lien_invalide');
      return;
    }

    // Erreur dans les query params
    const queryError = params.get('error');
    if (queryError) {
      router.replace('/mon-espace/connexion?error=lien_invalide');
      return;
    }

    // Flow implicite : access_token dans le hash (liens d'invitation Supabase)
    const hashAccessToken = hashParams.get('access_token');
    if (hashAccessToken) {
      supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashParams.get('refresh_token') || '',
      }).then(({ error }) => {
        if (error) {
          router.replace('/mon-espace/connexion?error=lien_invalide');
        } else if (hashParams.get('type') === 'recovery') {
          router.replace('/mon-espace/nouveau-mot-de-passe');
        } else {
          router.replace('/mon-espace');
        }
      });
      return;
    }

    // Flow PKCE : code dans les query params
    const code = params.get('code');
    if (!code) {
      router.replace('/mon-espace/connexion');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace('/mon-espace/connexion?error=lien_invalide');
      } else if (params.get('type') === 'recovery') {
        router.replace('/mon-espace/nouveau-mot-de-passe');
      } else {
        router.replace('/mon-espace');
      }
    });
  }, []);

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
