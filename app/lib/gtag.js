export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function gtagEvent(action, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}

/* Normalise un numéro FR au format E.164 (+33…) pour le suivi avancé */
function normalizePhone(p) {
  const s = String(p).replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('0')) return '+33' + s.slice(1);
  if (s.startsWith('33')) return '+' + s;
  return s;
}

/* Suivi de conversion avancé (Enhanced Conversions).
   On fournit au tag Google les données first-party du lead : il les NORMALISE
   et les HACHE (SHA-256) DANS LE NAVIGATEUR avant envoi — rien ne part en clair,
   rien n'est stocké côté site. L'envoi est conditionné au consentement
   (Consent Mode : ad_user_data). À appeler juste avant `generate_lead`. */
export function gtagSetUserData({ email, phone, firstName, lastName, street, city, postalCode } = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  const data = {};
  if (email) data.email = String(email).trim().toLowerCase();
  if (phone) data.phone_number = normalizePhone(phone);
  const address = {};
  if (firstName)  address.first_name  = String(firstName).trim().toLowerCase();
  if (lastName)   address.last_name   = String(lastName).trim().toLowerCase();
  if (street)     address.street      = String(street).trim().toLowerCase();
  if (city)       address.city        = String(city).trim().toLowerCase();
  if (postalCode) address.postal_code = String(postalCode).trim();
  if (Object.keys(address).length) data.address = address;
  if (Object.keys(data).length) window.gtag('set', 'user_data', data);
}

export function gtagBeacon(action, params = {}) {
  if (typeof window === 'undefined' || !GA_ID) return;
  const body = new URLSearchParams({
    v: '2',
    tid: GA_ID,
    cid: (document.cookie.match(/_ga=GA\d+\.\d+\.(\d+\.\d+)/)?.[1]) ?? 'unknown',
    en: action,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [`ep.${k}`, v])),
  });
  navigator.sendBeacon('https://www.google-analytics.com/g/collect?' + body.toString());
}
