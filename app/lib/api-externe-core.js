/*
 * Appels aux services externes (Qonto, Brevo, Google, Mollie, Tidal…) — le cœur, sans dépendance.
 *
 * Ce fichier ne connaît ni Next.js ni Supabase : il décide quand relancer, nettoie ce qui sera
 * enregistré et décide quand alerter. Le branchement réel (base, e-mail) est dans
 * lib/api-externe.js. Séparé pour être testé sans serveur : tests/api-externe.test.mjs (`npm test`).
 *
 * Règles validées par Myrio le 21/11/2026 :
 * - 3 tentatives au plus, attente de 0,5 s puis 1,5 s (± 20 %), Retry-After respecté (5 s max).
 * - Lecture (GET, HEAD, OPTIONS, PUT, DELETE : rejouables sans effet de bord) : relance sur délai
 *   dépassé, erreur réseau, 408, 429 et 5xx.
 * - Création (POST, PATCH) : relance seulement quand on est sûr que rien n'a été fait — 429, 503,
 *   connexion impossible. Jamais après un délai dépassé ou une erreur 500 : la facture ou l'e-mail
 *   est peut-être déjà parti, une relance ferait un doublon.
 * - Jamais de relance sur les autres erreurs 4xx.
 * - Rien de personnel enregistré : adresse sans paramètres et identifiants remplacés par :id,
 *   message nettoyé (e-mails, téléphones, IBAN, clés masqués) et coupé à 300 caractères.
 */
import { escapeHtml } from './html-escape.js';

export const MAX_TENTATIVES = 3;
export const ATTENTE_BASE_MS = 500;
export const FACTEUR_ATTENTE = 3;
export const ATTENTE_MAX_MS = 5000;
export const DELAI_DEFAUT_MS = 15000;
// Durée totale maximale d'un appel, relances comprises : aucune nouvelle tentative n'est lancée
// si elle risque de la dépasser, et la dernière tentative est raccourcie pour tenir dedans.
export const BUDGET_DEFAUT_MS = 25000;
// Créations (POST, PATCH) : jamais relancées après un délai dépassé, donc un délai plus large pour
// ne pas couper une création lente (devis, facture, e-mail), qui n'avait aucune limite avant.
export const DELAI_CREATION_MS = 30000;
export const BUDGET_CREATION_MS = 40000;
export const FENETRE_ALERTE_MS = 15 * 60 * 1000;
const LONGUEUR_MESSAGE = 300;

const METHODES_REJOUABLES = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

// Erreurs réseau survenues AVANT l'envoi de la demande (connexion refusée, nom de domaine
// introuvable, connexion jamais établie) : le service n'a rien reçu, une relance est sans risque
// même pour une création. ECONNRESET et consorts n'en font pas partie : la demande a pu arriver.
const ERREURS_AVANT_ENVOI = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'EHOSTUNREACH', 'ENETUNREACH',
]);

// Noms affichés (e-mail d'alerte, page Journal des erreurs). La clé est celle passée à apiFetch.
export const SERVICES = {
  qonto: 'Qonto',
  'qonto-oauth': 'Qonto (connexion)',
  brevo: 'Brevo (e-mails)',
  'google-agenda': 'Google Agenda',
  'google-drive': 'Google Drive',
  mollie: 'Mollie',
  tidal: 'Tidal',
  'tidal-oauth': 'Tidal (connexion)',
  deezer: 'Deezer',
  mapbox: 'Mapbox (adresses)',
  annuaire: 'Annuaire des entreprises',
  hibp: 'Vérification des mots de passe',
  plaud: 'Plaud (via n8n)',
  site: 'Site myracoustic.com',
};

export function nomService(cle) {
  return SERVICES[cle] || cle;
}

// Une phrase simple pour chaque type d'erreur (e-mail d'alerte, page Journal des erreurs).
export function sensDuCode({ error_type: type, status_code: code }) {
  if (type === 'timeout') return 'pas de réponse dans le délai';
  if (type === 'network') return 'connexion impossible';
  if (code === 429) return 'trop de demandes, le service freine';
  if (code >= 500) return 'panne ou surcharge chez le service';
  if (code === 401 || code === 403) return 'accès refusé : clé ou autorisation à vérifier';
  if (code === 404) return 'élément introuvable';
  if (code === 400 || code === 422) return 'demande refusée : donnée invalide';
  return 'demande refusée';
}

// ─── Décisions ──────────────────────────────────────────────────────────────────────────────

export function estRelancable(echec, rejouable) {
  if (echec.type === 'http') {
    if (echec.status === 429 || echec.status === 503) return true;
    return rejouable && (echec.status === 408 || echec.status >= 500);
  }
  if (echec.type === 'timeout') return rejouable;
  return rejouable || ERREURS_AVANT_ENVOI.has(echec.code);
}

// Attente avant la tentative n° `prochaine` (2 → 0,5 s, 3 → 1,5 s), ± 20 % pour que plusieurs
// fonctions en échec ne relancent pas toutes à la même milliseconde.
export function attenteAvant(prochaine, { aleatoire = Math.random, retryAfterMs = null, baseMs = ATTENTE_BASE_MS } = {}) {
  const base = baseMs * FACTEUR_ATTENTE ** (prochaine - 2);
  const variee = Math.round(base * (0.8 + 0.4 * aleatoire()));
  const attente = retryAfterMs != null ? Math.max(variee, retryAfterMs) : variee;
  return Math.min(attente, ATTENTE_MAX_MS);
}

// En-tête Retry-After : nombre de secondes ou date HTTP. Retourne des millisecondes ou null.
export function lireRetryAfter(valeur, maintenantMs = Date.now()) {
  if (!valeur) return null;
  const secondes = Number(valeur);
  if (Number.isFinite(secondes)) return Math.max(0, secondes * 1000);
  const date = Date.parse(valeur);
  return Number.isFinite(date) ? Math.max(0, date - maintenantMs) : null;
}

// ─── Nettoyage de ce qui est enregistré ─────────────────────────────────────────────────────

// « https://thirdparty.qonto.com/v2/quotes/8f1c…?q=jean@x.fr » → « thirdparty.qonto.com/v2/quotes/:id ».
// Les paramètres (?…) disparaissent toujours : ils portent parfois une clé (Mapbox) ou un e-mail
// (recherche client Qonto). Un segment qui n'est pas un mot simple en minuscules devient :id
// (identifiants Mollie « tr_WDqYK6vllg », préfixe de mot de passe « 5BAA6 »…). Un mot en minuscules
// passe : pour une adresse qui contient une saisie (recherche Mapbox), passer options.endpoint.
export function nettoyerAdresse(url) {
  let u;
  try { u = new URL(String(url)); } catch { return 'adresse illisible'; }
  const chemin = u.pathname.split('/').map((segment) => {
    if (!segment) return segment;
    let s = segment;
    try { s = decodeURIComponent(segment); } catch { /* segment illisible : remplacé ci-dessous */ }
    const chiffres = (s.match(/\d/g) || []).length;
    return /^[a-z][a-z0-9_.-]*$/.test(s) && s.length <= 30 && chiffres <= 2 ? s : ':id';
  }).join('/');
  return `${u.host}${chemin}`.slice(0, 300);
}

// Masque ce qui se reconnaît (e-mails, téléphones, IBAN, adresses postales, clés). Un nom de
// personne isolé ne se reconnaît pas : d'où messageDepuisCorps, qui ne garde que les champs d'erreur.
export function nettoyerMessage(texte, secrets = []) {
  if (texte == null || texte === '') return null;
  // %40 / %2B : un e-mail encodé dans une adresse est d'abord décodé, pour être reconnu.
  let t = String(texte).toWellFormed().replace(/\u0000/g, '').replace(/%40/gi, '@').replace(/%2B/gi, '+');
  for (const s of secrets) if (typeof s === 'string' && s.length >= 8) t = t.split(s).join('[clé]');
  t = t
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(Bearer|Basic)\s+\S+/gi, '$1 [clé]')
    // Valeur d'un champ de nom ou d'adresse recopiée par le service : « "last_name": "Dupont" ».
    .replace(/("?\b(?:first_?name|last_?name|full_?name|name|nom|prenom|prénom|address|adresse|street_address|city|ville)"?\s*[:=]\s*)("[^"]*"|'[^']*')/gi, '$1"[masqué]"')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[e-mail]')
    .replace(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g, '[iban]')
    .replace(/(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g, '[téléphone]')
    .replace(/\+\d{1,3}(?:[\s.-]?\d){6,14}\b/g, '[téléphone]')
    .replace(/\b\d{1,4}\s?(?:bis|ter)?,?\s+(?:rue|avenue|av\.?|boulevard|bd|chemin|all[ée]e|impasse|place|route|quai|cours|lieu-dit|lotissement)\b[^,;\n]*/gi, '[adresse]')
    .replace(/\b\d{5}\s+\p{L}[\p{L}'’ -]*/gu, '[code postal et ville]')
    .replace(/\b\d{9,}\b/g, '[numéro]')
    // Jeton ou clé : longue suite mêlant lettres et chiffres. Un long code d'erreur en lettres
    // (« client_invoice_payment_method_not_allowed ») reste lisible.
    .replace(/[A-Za-z0-9_\-+=]{32,}/g, (m) => (/\d/.test(m) && /[A-Za-z]/.test(m) ? '[masqué]' : m))
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;
  // Coupe par caractère (et non par unité de code) : un émoji n'est jamais coupé en deux, ce que
  // la base refuserait (ligne perdue).
  const caracteres = Array.from(t);
  return caracteres.length > LONGUEUR_MESSAGE ? `${caracteres.slice(0, LONGUEUR_MESSAGE - 1).join('')}…` : t;
}

// Corps d'une réponse en erreur → le texte d'erreur seul. Les services renvoient leurs erreurs en
// JSON (Brevo { code, message }, Qonto { errors: [{ code, detail }] }, Mollie { title, detail },
// Google { error: { message } }) : on ne garde que ces champs, jamais le reste du corps, qui peut
// recopier les données envoyées (nom, adresse du client).
export function messageDepuisCorps(texte) {
  if (!texte) return null;
  let json;
  // Corps qui n'est pas du JSON (page HTML d'erreur, texte brut) : jamais recopié, il peut
  // contenir n'importe quoi ; le journal garde alors « Réponse <code> ».
  try { json = JSON.parse(texte); } catch { return null; }
  const morceaux = [];
  const ajouter = (v) => { if (typeof v === 'string' && v.trim()) morceaux.push(v.trim()); };
  if (Array.isArray(json?.errors)) {
    for (const e of json.errors.slice(0, 3)) { ajouter(e?.code); ajouter(e?.detail || e?.message || e?.title); }
  }
  ajouter(json?.code);
  ajouter(json?.title);
  ajouter(json?.detail);
  ajouter(typeof json?.error === 'string' ? json.error : json?.error?.message);
  ajouter(json?.error_description);
  ajouter(json?.message);
  return morceaux.length ? [...new Set(morceaux)].join(' — ') : null;
}

function codeReseau(err) {
  return err?.cause?.code || err?.cause?.errors?.[0]?.code || err?.code || null;
}

// ─── Appels avec relances ───────────────────────────────────────────────────────────────────

/*
 * Fabrique les fonctions d'appel. Toutes les dépendances sont injectables (tests).
 * `signaler(ligne)` reçoit chaque appel qui a connu au moins un échec ; il ne doit jamais faire
 * échouer l'appel lui-même (ses erreurs sont avalées ici).
 */
export function creerAppelsExternes({
  fetch: fetchImpl = (...a) => globalThis.fetch(...a),
  attendre = (ms) => new Promise((r) => setTimeout(r, ms)),
  maintenant = () => Date.now(),
  aleatoire = Math.random,
  signaler = async () => {},
  secrets = () => [],
  app = 'plateforme',
} = {}) {
  async function prevenir(ligne) {
    try { await signaler(ligne); } catch (err) { console.error('[api-externe] signalement impossible :', err?.message); }
  }

  async function executer({ service, methode, endpoint, rejouable, maxTentatives, budgetMs, attenteBaseMs, dureeTentativeMs = 0, tentative }) {
    const debut = maintenant();
    let dernierEchec = null;
    for (let n = 1; ; n++) {
      const issue = await tentative({ restantMs: budgetMs - (maintenant() - debut) });
      // Longueurs bornées comme dans la table (sinon la ligne serait refusée et perdue).
      const ligne = (echec, finalStatus) => ({
        app,
        service: String(service).slice(0, 40),
        method: String(methode).slice(0, 10),
        endpoint: String(endpoint).slice(0, 300),
        status_code: echec.status ?? null,
        error_type: echec.type,
        message: nettoyerMessage(echec.message, secrets()),
        attempts: Math.min(n, 10),
        final_status: finalStatus,
        duration_ms: Math.max(0, Math.round(maintenant() - debut)),
      });
      if (issue.ok) {
        if (dernierEchec) await prevenir(ligne(dernierEchec, 'resolved'));
        return issue.valeur;
      }
      // Arrêt demandé par le code appelant, ou erreur de programmation (adresse mal écrite…) :
      // pas une panne du service, rien à relancer ni à enregistrer.
      if (issue.arret) throw issue.erreur;
      dernierEchec = issue.echec;
      const attente = attenteAvant(n + 1, { aleatoire, retryAfterMs: issue.retryAfterMs ?? null, baseMs: attenteBaseMs ?? ATTENTE_BASE_MS });
      // Une nouvelle tentative doit tenir dans la durée totale : au moins 1 s de marge, ou toute sa
      // durée possible quand elle ne peut pas être raccourcie (bibliothèques Google).
      const horsBudget = maintenant() - debut + attente + Math.max(1000, dureeTentativeMs) > budgetMs;
      if (n >= maxTentatives || issue.definitif || horsBudget || !estRelancable(issue.echec, rejouable)) {
        await prevenir(ligne(issue.echec, 'failed'));
        if (issue.erreur) throw issue.erreur;
        return issue.valeur;
      }
      issue.liberer?.();
      await attendre(attente);
    }
  }

  /*
   * Remplace `fetch(url, init)` ligne pour ligne : même réponse rendue (y compris une réponse en
   * erreur, que le code appelant traite comme avant), même exception en cas d'échec réseau.
   * options :
   *   endpoint        adresse à enregistrer, si la version nettoyée automatiquement ne convient pas
   *   rejouable       force la règle lecture (true) ou création (false) ; par défaut selon la méthode
   *   statutsNormaux  codes qui font partie du fonctionnement normal (ex. [404]) : ni relance ni journal
   *   delaiMs         temps d'attente maximum par tentative (15 s par défaut, 30 s pour une création)
   *   budgetMs        durée totale maximale, relances comprises (25 s par défaut, 40 s pour une création)
   *   delaiCouvreCorps le délai couvre aussi la lecture du corps de la réponse (comme l'ancien
   *                   AbortSignal.timeout) ; sinon il s'arrête à l'arrivée des en-têtes
   *   attenteBaseMs   attente avant la 2e tentative (0,5 s par défaut ; la 3e attend 3 fois plus)
   *   maxTentatives   3 par défaut
   * Un délai déjà posé par le code appelant (signal: AbortSignal.timeout(…)) est respecté et
   * enregistré, mais ne peut pas être relancé (ce signal reste expiré) : à la migration, le
   * remplacer par l'option delaiMs.
   */
  async function apiFetch(service, url, init = {}, options = {}) {
    const methode = String(init.method || 'GET').toUpperCase();
    const rejouable = options.rejouable ?? METHODES_REJOUABLES.has(methode);
    const delaiMs = options.delaiMs ?? (rejouable ? DELAI_DEFAUT_MS : DELAI_CREATION_MS);
    const normaux = new Set(options.statutsNormaux || []);
    return executer({
      service, methode, rejouable,
      endpoint: options.endpoint || nettoyerAdresse(url),
      maxTentatives: options.maxTentatives ?? MAX_TENTATIVES,
      budgetMs: options.budgetMs ?? (rejouable ? BUDGET_DEFAUT_MS : BUDGET_CREATION_MS),
      attenteBaseMs: options.attenteBaseMs,
      tentative: async ({ restantMs }) => {
        const delai = Math.min(delaiMs, Math.max(1000, restantMs));
        const controleur = new AbortController();
        const minuteur = setTimeout(() => controleur.abort(new DOMException('Délai dépassé', 'TimeoutError')), delai);
        const signal = init.signal ? AbortSignal.any([init.signal, controleur.signal]) : controleur.signal;
        let garderMinuteur = false;
        try {
          const res = await fetchImpl(url, { ...init, signal });
          // 2xx, et 3xx non suivies (304 « pas modifié ») : pas des échecs.
          if (res.status < 400 || normaux.has(res.status)) {
            // Délai qui couvre aussi la lecture du corps : le minuteur continue (sans retenir le
            // processus) et coupe une réponse qui n'en finit pas, comme l'ancien AbortSignal.timeout.
            if (options.delaiCouvreCorps) { garderMinuteur = true; minuteur.unref?.(); }
            return { ok: true, valeur: res };
          }
          // Copie lue pour le message : la réponse d'origine reste intacte pour le code appelant.
          const corps = await res.clone().text().catch(() => '');
          return {
            ok: false, valeur: res,
            echec: { type: 'http', status: res.status, message: messageDepuisCorps(corps) || `Réponse ${res.status}` },
            retryAfterMs: lireRetryAfter(res.headers?.get?.('retry-after'), maintenant()),
            liberer: () => { res.body?.cancel?.().catch(() => {}); },
          };
        } catch (err) {
          if (init.signal?.aborted) {
            if (init.signal.reason?.name === 'TimeoutError') {
              return { ok: false, erreur: err, definitif: true, echec: { type: 'timeout', message: 'Pas de réponse dans le délai fixé par le code appelant' } };
            }
            return { ok: false, arret: true, erreur: err };
          }
          if (controleur.signal.aborted) {
            return { ok: false, erreur: err, echec: { type: 'timeout', message: `Pas de réponse au bout de ${Math.round(delai / 1000)} s` } };
          }
          // Node signale toute erreur réseau par « fetch failed » (cause : ECONNREFUSED, ENOTFOUND…).
          // Le reste (adresse mal écrite, option invalide) est une erreur de programmation.
          if (err?.message !== 'fetch failed') return { ok: false, arret: true, erreur: err };
          const code = codeReseau(err);
          return { ok: false, erreur: err, echec: { type: 'network', code, message: `Connexion impossible${code ? ` (${code})` : ''}` } };
        } finally {
          if (!garderMinuteur) clearTimeout(minuteur);
        }
      },
    });
  }

  /*
   * Pour les bibliothèques qui ne passent pas par fetch (Google Agenda et Drive) :
   * `appel` est une fonction qui lance la demande. Mêmes règles ; l'erreur d'origine est relancée
   * telle quelle en cas d'échec définitif, comme sans le module.
   * options : methode (pour la règle lecture/création, 'GET' par défaut), rejouable,
   * statutsNormaux (erreurs attendues, relancées sans journal ni nouvelle tentative), maxTentatives,
   * budgetMs, delaiMs.
   * Le temps d'attente maximum se règle sur le client Google lui-même (option timeout) ; delaiMs
   * (15 s par défaut) le rappelle ici, pour ne lancer une nouvelle tentative que si elle peut tenir
   * en entier dans budgetMs.
   */
  async function apiSdk(service, endpoint, appel, options = {}) {
    const methode = String(options.methode || 'GET').toUpperCase();
    const rejouable = options.rejouable ?? METHODES_REJOUABLES.has(methode);
    const normaux = new Set(options.statutsNormaux || []);
    return executer({
      service, methode, endpoint, rejouable,
      maxTentatives: options.maxTentatives ?? MAX_TENTATIVES,
      budgetMs: options.budgetMs ?? BUDGET_DEFAUT_MS,
      attenteBaseMs: options.attenteBaseMs,
      dureeTentativeMs: options.delaiMs ?? DELAI_DEFAUT_MS,
      tentative: async () => {
        try {
          return { ok: true, valeur: await appel() };
        } catch (err) {
          const status = Number(err?.status ?? err?.response?.status ?? err?.code);
          if (Number.isInteger(status) && status >= 100 && status < 600) {
            if (normaux.has(status)) return { ok: false, arret: true, erreur: err };
            const message = err?.response?.data?.error?.message || err?.response?.data?.error_description || err?.message;
            const retry = err?.response?.headers?.['retry-after'] ?? err?.response?.headers?.get?.('retry-after');
            return { ok: false, erreur: err, echec: { type: 'http', status, message }, retryAfterMs: lireRetryAfter(retry, maintenant()) };
          }
          const code = codeReseau(err);
          if (err?.name === 'TimeoutError' || code === 'ETIMEDOUT' || /timeout/i.test(String(err?.message))) {
            return { ok: false, erreur: err, echec: { type: 'timeout', code, message: 'Pas de réponse dans le délai' } };
          }
          // Sans code HTTP ni code réseau : erreur de programmation, pas une panne du service.
          if (typeof code !== 'string' || !/^E[A-Z_]+$|^UND_ERR/.test(code)) return { ok: false, arret: true, erreur: err };
          return { ok: false, erreur: err, echec: { type: 'network', code, message: `Connexion impossible (${code})` } };
        }
      },
    });
  }

  return { apiFetch, apiSdk };
}

// ─── Alertes ────────────────────────────────────────────────────────────────────────────────

/*
 * Une alerte e-mail par service toutes les 15 minutes au plus.
 * `store` (lib/api-externe.js en vrai, une version en mémoire dans les tests) :
 *   lireEtat(service)                          → { last_alert_at } | null
 *   creerEtat(service)                         crée la ligne si elle manque
 *   prendreCreneau(service, precedent, nouveau) → true si cette fonction a gagné le créneau
 *       (mise à jour conditionnelle : deux échecs simultanés n'envoient qu'un seul e-mail)
 *   rendreCreneau(service, nouveau, precedent)  annule la prise si l'e-mail n'est pas parti
 *   echecsNonSignales()                        → [{ id, service }] échecs définitifs pas encore signalés
 *   marquerSignales(ids)
 * La ligne de l'échec en cours est enregistrée AVANT l'appel à alerter : elle fait partie du compte.
 * Si l'e-mail ne part pas (Brevo en panne), le créneau est rendu : l'échec reste « non signalé »
 * et sera repris dans la prochaine alerte qui part, quel que soit le service.
 */
export function creerAlerteur({ store, envoyer, maintenant = () => Date.now(), fenetreMs = FENETRE_ALERTE_MS }) {
  return async function alerter(ligne) {
    if (ligne.final_status !== 'failed') return { envoyee: false, raison: 'resolu' };
    const { service } = ligne;
    let etat = await store.lireEtat(service);
    if (!etat) {
      await store.creerEtat(service);
      etat = (await store.lireEtat(service)) || { last_alert_at: null };
    }
    const precedent = etat.last_alert_at || null;
    const t = maintenant();
    if (precedent && t - Date.parse(precedent) < fenetreMs) return { envoyee: false, raison: 'fenetre' };
    const nouveau = new Date(t).toISOString();
    if (!(await store.prendreCreneau(service, precedent, nouveau))) return { envoyee: false, raison: 'deja-pris' };

    let nonSignales = [];
    try { nonSignales = await store.echecsNonSignales(); } catch { /* l'alerte part sans le décompte */ }
    const duService = nonSignales.filter((r) => r.service === service);
    const parService = new Map();
    for (const r of nonSignales) if (r.service !== service) parService.set(r.service, (parService.get(r.service) || 0) + 1);
    const autres = [...parService].map(([s, echecs]) => ({ service: s, echecs })).sort((a, b) => b.echecs - a.echecs);

    try {
      await envoyer({ ...ligne, quand: t, echecsGroupes: Math.max(1, duService.length), autres, fenetreMinutes: Math.round(fenetreMs / 60000) });
    } catch (err) {
      await Promise.resolve(store.rendreCreneau(service, nouveau, precedent)).catch(() => {});
      return { envoyee: false, raison: 'envoi', erreur: err };
    }
    await Promise.resolve(store.marquerSignales(nonSignales.map((r) => r.id))).catch(() => {});
    return { envoyee: true, echecsGroupes: Math.max(1, duService.length), autres };
  };
}

// ─── Contenu de l'e-mail d'alerte ───────────────────────────────────────────────────────────
// Charte des alertes admin (fond #0d1b2a, carte #11233a, bouton lime) ; le rouge #f87171 est celui
// des erreurs de la plateforme, toujours accompagné du mot « Alerte » (jamais la couleur seule).

function dateParis(ms) {
  return new Date(ms).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' });
}

export function contenuAlerte(a, { appUrl = 'https://app.myracoustic.com' } = {}) {
  const nom = nomService(a.service);
  const sens = sensDuCode(a);
  // Le journal s'ouvre directement filtré sur le service en cause.
  const lien = `${appUrl}/admin/journal-erreurs?service=${encodeURIComponent(a.service)}`;
  const code = a.status_code ?? (a.error_type === 'timeout' ? 'délai dépassé' : 'réseau');
  const tentatives = a.attempts === 1 ? '1 (ce type d’erreur ne se relance pas)' : String(a.attempts);
  const resume = a.attempts === 1 ? `Échec sans relance possible : ${sens}.` : `Échec après ${a.attempts} tentatives : ${sens}.`;

  const ligne = (label, valeur) => `
      <tr><td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.62);font-size:13px;width:110px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);color:#ffffff;font-size:14px;line-height:1.5;word-break:break-word;">${valeur}</td></tr>`;

  const groupes = a.echecsGroupes > 1
    ? `<p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 20px;">En tout, ${a.echecsGroupes} échecs de ${escapeHtml(nom)} depuis la dernière alerte.</p>`
    : '';
  const autres = a.autres?.length
    ? `<p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.7;margin:0 0 24px;">Aussi à regarder : ${a.autres
      .map((o) => `${escapeHtml(nomService(o.service))} (${o.echecs} échec${o.echecs > 1 ? 's' : ''} non signalé${o.echecs > 1 ? 's' : ''})`).join(', ')}.</p>`
    : '';

  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(`${resume} ${a.method} ${a.endpoint}`)}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:40px;">
    <p style="color:#f87171;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">Alerte technique</p>
    <p style="color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;margin:0 0 12px;">Un appel à ${escapeHtml(nom)} a échoué</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 20px;">${escapeHtml(resume)} L’action qui en dépendait n’a peut-être pas été faite.</p>
    ${groupes}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#11233a;border-radius:8px;margin:0 0 24px;"><tr><td style="padding:6px 20px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${ligne('Opération', escapeHtml(`${a.method} ${a.endpoint}`))}
      ${ligne('Code', escapeHtml(`${code} · ${sens}`))}
      ${a.message ? ligne('Message', escapeHtml(a.message)) : ''}
      ${ligne('Tentatives', escapeHtml(tentatives))}
      ${ligne('Quand', escapeHtml(dateParis(a.quand)))}
      </table>
    </td></tr></table>
    ${autres}
    <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.7;margin:0 0 28px;">
      <strong style="color:#ffffff;">Que faire :</strong> ouvrez le journal pour voir le détail. Si l’erreur continue, vérifiez l’état du service ou transmettez ce message pour analyse.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;">
      <a href="${lien}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">Ouvrir le journal des erreurs →</a>
    </td></tr></table>
    <p style="color:rgba(255,255,255,0.62);font-size:13px;line-height:1.6;margin:28px 0 0;">
      Pour ne pas vous inonder, les prochains échecs de ${escapeHtml(nom)} dans les ${a.fenetreMinutes ?? 15} minutes n’enverront pas d’e-mail. Ils restent visibles dans le journal.
    </p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  return { sujet: `Alerte : un appel à ${nom} a échoué`, html };
}
