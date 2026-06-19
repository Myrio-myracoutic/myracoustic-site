const MONTHS_FR = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11,
};

/* Extrait la date de prestation depuis l'en-tête du devis : "... · Date : 15 septembre 2026 · ..." */
export function parseDateFromHeader(header) {
  if (!header) return null;
  const match = header.match(/Date\s*:\s*(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/i);
  if (!match) return null;

  const [, day, monthName, year] = match;
  const month = MONTHS_FR[monthName.toLowerCase()];
  if (month === undefined) return null;

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
