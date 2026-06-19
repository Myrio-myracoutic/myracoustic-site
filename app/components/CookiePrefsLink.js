'use client';

export default function CookiePrefsLink() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('myra-cookie-prefs'))}
      style={{
        position: 'fixed', bottom: 8, left: 12, zIndex: 999,
        color: 'rgba(255,255,255,0.22)', fontSize: 11, background: 'none', border: 'none', padding: 4,
        cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.12)',
        fontFamily: 'inherit',
      }}
    >
      Préférences cookies
    </button>
  );
}
