export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function gtagEvent(action, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
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
