'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getConsent, CONSENT_EVENT } from '../lib/consent';
import { META_PIXEL_ID, loadMetaPixel, metaTrack } from '../lib/meta-pixel';

/* Pages jamais envoyées à Meta : back-office, espace client, et toutes les pages
   dont l'adresse contient un code d'accès personnel (proposition, rendez-vous,
   invitation, connexion) — Meta reçoit l'adresse complète de la page vue.
   Idem si l'adresse contient un e-mail (lien de reprise du devis). */
const PRIVATE_PREFIXES = ['/admin', '/mon-espace', '/proposition', '/rendez-vous', '/invitation', '/auth'];

function isPrivatePage(pathname) {
  if (pathname && PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  return typeof window !== 'undefined' && /[?&]email=/.test(window.location.search);
}

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
    if (isPrivatePage(pathname)) return;
    loadMetaPixel();
    metaTrack('PageView');
  }, [granted, pathname]);

  return null;
}
