/** Échappe un texte avant de l'insérer dans un email HTML — trouvé à l'audit sécurité du
 * Chantier 1 : des champs saisis publiquement (nom invité, adresse...) étaient insérés tels
 * quels, permettant d'injecter du HTML dans des emails envoyés depuis contact@myracoustic.com. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
