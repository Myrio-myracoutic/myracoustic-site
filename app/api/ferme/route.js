import { NextResponse } from 'next/server';

// Étape 4 du chantier particuliers (17/11) : l'ancien espace client, l'ancien admin et l'ancien
// devis instantané du site sont fermés. next.config.mjs (rewrites) renvoie ici toutes leurs
// routes d'API : elles répondent « fermé » au lieu d'agir. Tout se passe sur la plateforme.
const ferme = () => NextResponse.json(
  { error: 'Cette partie du site est fermée. Votre espace se trouve désormais sur app.myracoustic.com.' },
  { status: 410 },
);

export const GET = ferme;
export const POST = ferme;
export const PUT = ferme;
export const PATCH = ferme;
export const DELETE = ferme;
