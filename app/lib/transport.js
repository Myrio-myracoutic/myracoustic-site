/* Frais de déplacement & technicien — partagés entre les tunnels de devis.
   Barème identique à la grille tarifaire (docs/grilles-tarifaires.md §6-7).
   Départ : Nort-sur-Erdre. Distance routière aller-retour via Mapbox.
   (DevisFlow garde encore ses propres copies locales ; à unifier ici à terme.) */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
export const ORIGIN_COORDS = [-1.4972, 47.4453]; /* Nort-sur-Erdre */
export const TECH_PRICE = 100; /* technicien supplémentaire — au-delà de 100 invités */

/* Forfait transport par tranche de distance aller-retour (km).
   null = au-delà de 600 km → établi sur devis. */
export function getTransportFee(km) {
  if (!km)       return 0;
  if (km <= 100) return 40;
  if (km <= 200) return 60;
  if (km <= 400) return 80;
  if (km <= 600) return 100;
  return null;
}

/* Distance routière aller-retour (km), arrondie, depuis Nort-sur-Erdre. */
export async function getRoadKm([lng, lat]) {
  const res = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${ORIGIN_COORDS[0]},${ORIGIN_COORDS[1]};${lng},${lat}` +
    `?access_token=${MAPBOX_TOKEN}&overview=false`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const meters = data.routes?.[0]?.distance;
  if (!meters) return null;
  return Math.round((meters / 1000) * 2);
}
