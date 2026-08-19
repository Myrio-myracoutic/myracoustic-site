/* Calcul pur des bornes de période (semaine/mois/année) pour le dashboard KPI — courant,
   précédent, et même période l'an dernier. Aucune requête ici, juste des Date.

   Les tables qui alimentent les KPI datent au plus tôt du 21/07/2026 (mariage_leads) — comparer
   à une période antérieure à cette date n'aurait aucun sens (pas de données), donc previousYear
   est marqué indisponible plutôt que de produire un delta trompeur (+∞% ou 0%). */

export const DATA_START_DATE = new Date('2026-07-21T00:00:00Z');

function startOfWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=dimanche
  const diff = day === 0 ? 6 : day - 1; // lundi = début de semaine
  date.setUTCDate(date.getUTCDate() - diff);
  return date;
}

function rangeFor(kind, anchor) {
  if (kind === 'week') {
    const start = startOfWeek(anchor);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }
  if (kind === 'year') {
    const start = new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(anchor.getUTCFullYear() + 1, 0, 1));
    return { start, end };
  }
  // month (défaut)
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1));
  return { start, end };
}

function shiftBack(range, kind) {
  const { start, end } = range;
  if (kind === 'week') {
    return { start: new Date(start.getTime() - 7 * 86400000), end: new Date(end.getTime() - 7 * 86400000) };
  }
  if (kind === 'year') {
    return {
      start: new Date(Date.UTC(start.getUTCFullYear() - 1, start.getUTCMonth(), start.getUTCDate())),
      end: new Date(Date.UTC(end.getUTCFullYear() - 1, end.getUTCMonth(), end.getUTCDate())),
    };
  }
  return {
    start: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1)),
    end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)),
  };
}

function shiftBackOneYear(range) {
  const { start, end } = range;
  return {
    start: new Date(Date.UTC(start.getUTCFullYear() - 1, start.getUTCMonth(), start.getUTCDate())),
    end: new Date(Date.UTC(end.getUTCFullYear() - 1, end.getUTCMonth(), end.getUTCDate())),
  };
}

function label(range, kind) {
  const { start } = range;
  if (kind === 'week') return `Semaine du ${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;
  if (kind === 'year') return `${start.getUTCFullYear()}`;
  return start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * @param {'week'|'month'|'year'} kind
 * @param {Date} [anchor] date d'ancrage (défaut : aujourd'hui)
 * @returns {{ current: {start:Date,end:Date,label:string}, previous: {start:Date,end:Date,label:string}, previousYear: {start:Date,end:Date,label:string}|{available:false}, earliestDataStart: Date }}
 */
export function getPeriodRanges(kind, anchor = new Date()) {
  const currentRange = rangeFor(kind, anchor);
  const previousRange = shiftBack(currentRange, kind);
  const previousYearRange = shiftBackOneYear(currentRange);

  const previousYear = previousYearRange.start >= DATA_START_DATE
    ? { ...previousYearRange, label: label(previousYearRange, kind) }
    : { available: false };

  return {
    current: { ...currentRange, label: label(currentRange, kind) },
    previous: { ...previousRange, label: label(previousRange, kind) },
    previousYear,
    earliestDataStart: DATA_START_DATE,
  };
}

/** Delta en % entre deux valeurs, ou null si non calculable proprement (évite Infinity/NaN). */
export function deltaPct(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
