export const CONSENT_COOKIE = 'myra_consent';

/* Cookie posé sur .myracoustic.com pour être partagé entre
   myracoustic.com et devis.myracoustic.com (un seul bandeau pour les deux). */
function cookieDomain() {
  const host = window.location.hostname;
  return host.endsWith('myracoustic.com') ? '.myracoustic.com' : '';
}

export function getConsent() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return m ? m[1] : null;
}

export function setConsent(value) {
  const maxAge = 60 * 60 * 24 * 180; // 6 mois
  const domain = cookieDomain();
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${domain ? `; domain=${domain}` : ''}`;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: value === 'granted' ? 'granted' : 'denied',
      analytics_storage: value === 'granted' ? 'granted' : 'denied',
    });
  }
}
