'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getConsent, CONSENT_EVENT } from '../lib/consent';
import { META_PIXEL_ID, loadMetaPixel, metaTrack } from '../lib/meta-pixel';

/* Pixel Meta (Facebook / Instagram). Chargé seulement si le visiteur a cliqué
   « Accepter » dans le bandeau cookies. Une PageView par page vue, y compris lors
   des changements de page internes (Next ne recharge pas la page). */
export default function MetaPixel() {
  const pathname = usePathname();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const sync = () => setGranted(getConsent() === 'granted');
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!META_PIXEL_ID || !granted) return;
    // Back-office et espace client : rien à mesurer côté publicité.
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/mon-espace'))) return;
    loadMetaPixel();
    metaTrack('PageView');
  }, [granted, pathname]);

  return null;
}
