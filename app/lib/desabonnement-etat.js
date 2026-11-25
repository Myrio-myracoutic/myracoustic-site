import { supabaseAdmin } from './supabase-admin';
import { adresseNormale } from './desabonnement-core';

/* Lecture seule de la table email_desabonnements (écrite par la plateforme, où vit la page de
   désabonnement) : voir plateforme/lib/desabonnement.js et app/lib/desabonnement-core.js.
   Serveur uniquement : jamais importé par un composant navigateur. */

/*
 * L'adresse a-t-elle demandé l'arrêt des relances et des conseils ?
 * Base muette ou erreur : on répond non. Une relance de trop vaut mieux qu'un e-mail retenu sans
 * raison.
 */
export async function estDesabonne(email) {
  const adresse = adresseNormale(email);
  if (!adresse) return false;
  try {
    const { data, error } = await supabaseAdmin
      .from('email_desabonnements').select('email').eq('email', adresse).maybeSingle();
    if (error) {
      console.error('[desabonnement] lecture impossible :', error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error('[desabonnement] lecture impossible :', err?.message);
    return false;
  }
}
