'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DevisFlow from '../../../components/DevisFlow';

function DevisParticulier() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams?.get('email') || '';
  return <DevisFlow forcedProfil="particulier" initialEmail={emailFromUrl} />;
}

export default function DevisParticulierPage() {
  return (
    <Suspense>
      <DevisParticulier />
    </Suspense>
  );
}
