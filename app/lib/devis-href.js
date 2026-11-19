// Bouton « Demander un devis » du menu et du pied de page : mène directement au bon formulaire
// selon la page en cours (demande de Myrio, 19/11). Hors de ces pages : écran de choix /devis.
export function devisHref(pathname) {
  const p = pathname || '';
  if (p.startsWith('/mariage') || p.startsWith('/dj-mariage') || p.startsWith('/guide-dj-mariage')) {
    return '/devis/mariage-contact'; // commence par la vérification de la date
  }
  if (p.startsWith('/evenement-entreprise')) return '/devis/professionnel';
  if (p.startsWith('/evenements-prives')) return '/devis/particulier';
  return '/devis';
}
