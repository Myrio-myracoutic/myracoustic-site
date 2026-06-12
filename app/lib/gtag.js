export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function gtagEvent(action, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}
