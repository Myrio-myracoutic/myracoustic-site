/* Géocodage Mapbox partagé (tunnel devis + modale formule). */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(query) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=fr&autocomplete=true&types=address,place&limit=5&language=fr`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || []).map(f => {
    const types = f.place_type || [];
    const isAddress = types.includes('address');
    const ctx = f.context || [];
    const ctxText = (prefix) => ctx.find(c => c.id?.startsWith(prefix))?.text || '';
    const city = isAddress
      ? (ctxText('place') || ctxText('locality') || ctxText('district'))
      : ((types.includes('place') || types.includes('locality')) ? f.text : ctxText('place'));
    return {
      label: f.place_name,
      coords: f.center,
      street: isAddress ? (f.address ? `${f.address} ${f.text}` : f.text) : '',
      postcode: ctxText('postcode'),
      city,
    };
  });
}
