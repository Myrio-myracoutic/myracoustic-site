/*
 * Désabonnement maison (25/11/2026) — pur : ni base, ni Next.js. Utilisé par lib/api-externe.js
 * (chaque envoi d'e-mail), lib/desabonnement.js, la route /api/desabonnement et la page
 * /desabonnement ; testé par tests/desabonnement.test.mjs.
 * COPIE IDENTIQUE dans site/app/lib/desabonnement-core.js : toute modification se fait dans les
 * deux, `npm test` du site le vérifie.
 *
 * Pourquoi : Brevo ajoute à chaque e-mail un lien « Se désabonner » caché (en-tête
 * List-Unsubscribe), que Gmail, Orange… affichent en bouton à côté de notre nom. Un clic, et
 * Brevo bloque TOUT vers l'adresse : devis, identifiants, codes (une cliente est restée huit jours
 * sans nouvelles, du 17 au 25/11). Ce lien ne se retire pas avec l'offre gratuite, mais Brevo garde
 * le nôtre quand on en fournit un en https (essais du 25/11 : un mailto seul, une valeur vide ou
 * un List-Help ne changent rien). Notre lien mène à la plateforme, qui décide :
 * - un clic n'arrête que les relances et les conseils, c'est-à-dire les envois marqués
 *   `relance` (etiquetteRelance) ;
 * - tout le reste continue d'arriver : rendez-vous, proposition, devis signé, identifiants,
 *   codes, paiements.
 * Le lien porte l'adresse et une signature : personne ne peut désabonner quelqu'un d'autre.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const BASE_DESABONNEMENT = 'https://app.myracoustic.com';
export const CHEMIN_DESABONNEMENT = '/api/desabonnement';
// Étiquette Brevo (champ `tags`) des envois qu'un désabonnement arrête.
export const ETIQUETTE_RELANCE = 'relance';

// Partie avant le @ : tous les signes permis dans une adresse (une apostrophe, par exemple).
const ADRESSE = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/;
// Notre boîte reçoit les alertes : elle ne se désabonne jamais, même par un clic par mégarde.
const BOITES_INTERNES = new Set(['contact@myracoustic.com']);

/* Adresse en minuscules, sans espaces ; '' si elle n'a pas la forme d'une adresse. */
export function adresseNormale(email) {
  const a = String(email ?? '').trim().toLowerCase();
  return a.length <= 254 && ADRESSE.test(a) ? a : '';
}

export function boiteInterne(email) {
  return BOITES_INTERNES.has(adresseNormale(email));
}

/* Signature de l'adresse (32 caractères) ; '' sans adresse valable ou sans secret. */
export function signerAdresse(email, secret) {
  const a = adresseNormale(email);
  if (!a || !secret) return '';
  return createHmac('sha256', String(secret)).update(`desabonnement.v1.${a}`).digest('hex').slice(0, 32);
}

export function signatureValide(email, signature, secret) {
  const attendue = Buffer.from(signerAdresse(email, secret));
  const recue = Buffer.from(String(signature ?? ''));
  // Longueurs comparées en octets : timingSafeEqual refuse deux tailles différentes (une
  // signature fabriquée avec des lettres accentuées ne doit donner qu'un refus, pas une erreur).
  if (!attendue.length || recue.length !== attendue.length) return false;
  return timingSafeEqual(recue, attendue);
}

/* Lien personnel de désabonnement ; '' si l'adresse ou le secret manquent. */
export function lienDesabonnement(email, { secret, base = BASE_DESABONNEMENT, chemin = CHEMIN_DESABONNEMENT } = {}) {
  const a = adresseNormale(email);
  const s = signerAdresse(a, secret);
  if (!s) return '';
  return `${base}${chemin}?e=${Buffer.from(a, 'utf8').toString('base64url')}&s=${s}`;
}

/* Paramètres `e` et `s` d'un lien → { email, valide }. Un lien modifié ou tronqué n'est pas valide. */
export function lireLien({ e, s } = {}, secret) {
  let email = '';
  try {
    email = adresseNormale(Buffer.from(String(e ?? ''), 'base64url').toString('utf8'));
  } catch {
    email = '';
  }
  return { email, valide: !!email && signatureValide(email, s, secret) };
}

/* Est-ce l'envoi d'un e-mail par Brevo ? (les lectures de statistiques n'en sont pas) */
export function estEnvoiBrevo(service, url, init = {}) {
  return service === 'brevo'
    && /^https:\/\/api\.brevo\.com\/v3\/smtp\/email\/?$/.test(String(url ?? '').split('?')[0])
    && String(init?.method || 'GET').toUpperCase() === 'POST';
}

/*
 * Corps d'un envoi Brevo → { corps, destinataire, relance }, ou null s'il est illisible (dans ce
 * cas l'envoi part tel quel : on ne bloque jamais un e-mail parce qu'on n'a pas su le lire).
 * `destinataire` = première adresse de `to`, celle que le lien désabonne.
 */
export function lireEnvoi(init = {}) {
  if (typeof init?.body !== 'string') return null;
  let corps;
  try {
    corps = JSON.parse(init.body);
  } catch {
    return null;
  }
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) return null;
  const destinataire = adresseNormale(corps.to?.[0]?.email);
  if (!destinataire) return null;
  return { corps, destinataire, relance: Array.isArray(corps.tags) && corps.tags.includes(ETIQUETTE_RELANCE) };
}

/*
 * Le même envoi, avec notre lien « Se désabonner » à la place de celui de Brevo. `envoi` vient de
 * lireEnvoi. Sans secret, l'envoi est rendu tel quel (le lien de Brevo reste alors en place).
 */
export function avecLienDesabonnement(init, envoi, { secret, base } = {}) {
  const lien = lienDesabonnement(envoi?.destinataire, { secret, base });
  if (!lien) return init;
  const corps = {
    ...envoi.corps,
    headers: {
      ...(envoi.corps.headers || {}),
      'List-Unsubscribe': `<${lien}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
  return { ...init, body: JSON.stringify(corps) };
}

/* À étaler dans le corps d'un envoi Brevo : `...etiquetteRelance()` marque une relance ou un conseil. */
export function etiquetteRelance(oui = true) {
  return oui ? { tags: [ETIQUETTE_RELANCE] } : {};
}

/*
 * Réponse rendue à la place de celle de Brevo quand une relance n'est pas envoyée (adresse
 * désabonnée). Elle a la forme d'un envoi réussi : la tâche note sa relance comme faite et ne
 * réessaie pas toutes les heures.
 */
export function reponseEnvoiIgnore() {
  return new Response(JSON.stringify({ messageId: null, ignore: 'desabonne' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Envoi-Ignore': 'desabonne' },
  });
}
