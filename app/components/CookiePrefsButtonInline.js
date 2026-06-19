'use client';

export default function CookiePrefsButtonInline() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('myra-cookie-prefs'))}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--lime)', fontSize: 15, textDecoration: 'underline',
        fontFamily: 'inherit',
      }}
    >
      Modifier mes préférences cookies
    </button>
  );
}
