'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getConsent, CONSENT_EVENT } from '../lib/consent';
import { loadOpenAIPixel, openaiMeasure } from '../lib/openai-pixel';
import { isPrivatePage } from './MetaPixel';

/* Pixel OpenAI (publicités ChatGPT). Mêmes règles que le pixel Meta : chargé seulement
   après « Accepter » dans le bandeau cookies, jamais sur les pages privées (admin, espace
   client, liens personnels). Il lit au passage l'identifiant de clic ChatGPT (oppref)
   présent dans l'adresse d'arrivée, ce qui permet de rattacher une demande à la pub. */
export default function OpenAIPixel() {
  const pathname = usePathname();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const sync = () => setGranted(getConsent() === 'granted');
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!granted || isPrivatePage(pathname)) return;
    loadOpenAIPixel();
    openaiMeasure('page_viewed', { type: 'contents' });
  }, [granted, pathname]);

  return null;
}
