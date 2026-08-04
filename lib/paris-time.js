/* Petits utilitaires de fuseau horaire Europe/Paris, sans dépendance externe
   (aucune lib de date n'est installée dans le projet — Intl natif suffit).
   Nécessaire car les fonctions Vercel tournent en UTC et un planning
   "9h-18h" calculé naïvement casserait aux changements d'heure. */

/* Date du jour (YYYY-MM-DD) en heure de Paris. */
export function todayInParis() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/* Jour de semaine (0 = lundi ... 6 = dimanche) d'une date YYYY-MM-DD.
   Une date calendaire n'a pas besoin de conversion de fuseau : on prend midi
   pour éviter tout effet de bord DST sur le calcul du jour. */
export function parisWeekday(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

/* Convertit une date+heure locale Paris (YYYY-MM-DD, HH:mm) en instant UTC réel (ISO).
   Technique standard sans lib : on part d'un instant "naïf" (comme si HH:mm était déjà
   de l'UTC), on regarde quelle heure ça donnerait à Paris, et on corrige par l'écart —
   ce qui donne le bon décalage (+1h hiver / +2h été) sans le coder en dur. */
export function parisLocalToUtcISO(dateStr, hhmm) {
  const naiveUtc = new Date(`${dateStr}T${hhmm}:00.000Z`);

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(naiveUtc).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});

  const parisAsIfUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) === 24 ? 0 : Number(parts.hour), Number(parts.minute), Number(parts.second),
  );
  const offsetMs = parisAsIfUtc - naiveUtc.getTime();

  return new Date(naiveUtc.getTime() - offsetMs).toISOString();
}

/* Minutes écoulées depuis minuit pour "HH:mm" (utile pour comparer deux heures
   sans risquer l'effet de bord d'une comparaison de string autour de minuit). */
export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/* Ajoute des minutes à une heure "HH:mm" (reste dans la même journée, suffisant ici :
   aucune plage horaire ne traverse minuit). */
export function addMinutesToTime(hhmm, minutes) {
  const total = timeToMinutes(hhmm) + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/* Instant courant "HH:mm" à Paris — pour exclure les créneaux déjà passés aujourd'hui. */
export function nowInParis() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}
