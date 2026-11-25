import { after } from 'next/server';
import { supabaseAdmin } from './supabase-admin';
import { creerAppelsExternes, creerAlerteur, contenuAlerte, nomService } from './api-externe-core';
import { estEnvoiBrevo, lireEnvoi, avecLienDesabonnement, reponseEnvoiIgnore } from './desabonnement-core';
import { estDesabonne } from './desabonnement-etat';

/*
 * Point d'entrée unique pour appeler un service externe depuis le site (lot 4, 22/11/2026) :
 *   import { apiFetch, apiSdk } from '@/app/lib/api-externe';
 * Même fonctionnement que la plateforme (plateforme/lib/api-externe.js) : relances, journal dans
 * la table partagée api_error_logs (app = 'site'), alerte e-mail une fois par service toutes les
 * 15 min (table api_alert_state, partagée : une panne de Brevo vue par les deux applications ne
 * donne qu'une alerte). Le journal se lit sur la plateforme : app.myracoustic.com/admin/journal-erreurs.
 * Serveur uniquement (le site n'a pas le paquet server-only) : jamais importé par un composant
 * navigateur.
 *
 * api-externe-core.js est une COPIE IDENTIQUE de plateforme/lib/api-externe-core.js (règles,
 * nettoyage, alertes) : toute modification se fait dans les deux, `npm test` du site le vérifie.
 *
 * Depuis le 25/11, chaque envoi d'e-mail par Brevo reçoit ici notre lien « Se désabonner », et une
 * relance (envoi marqué `relance`) ne part pas vers une adresse désabonnée : voir apiFetch plus bas
 * et app/lib/desabonnement-core.js (copie identique de celui de la plateforme, elle aussi vérifiée).
 */

const APP = 'site';
const JOURNAL_URL = 'https://app.myracoustic.com'; // le journal des erreurs vit sur la plateforme
const ADMIN_EMAIL = 'contact@myracoustic.com';
const DELAI_BASE_MS = 4000;

// Valeurs des clés et secrets de l'environnement : masquées dans tout message enregistré.
function secretsConnus() {
  return Object.entries(process.env)
    .filter(([k, v]) => /KEY|SECRET|TOKEN|PASSWORD|LOGIN/i.test(k) && typeof v === 'string' && v.length >= 8)
    .map(([, v]) => v);
}

async function avecDelai(promesse, quoi) {
  let minuteur;
  const delai = new Promise((_, rejeter) => {
    minuteur = setTimeout(() => rejeter(new Error(`${quoi} : pas de réponse de la base`)), DELAI_BASE_MS);
  });
  try {
    const { data, error } = await Promise.race([promesse, delai]);
    if (error) throw new Error(`${quoi} : ${error.message}`);
    return data;
  } finally {
    clearTimeout(minuteur);
  }
}

const store = {
  lireEtat: (service) => avecDelai(
    supabaseAdmin.from('api_alert_state').select('last_alert_at').eq('service', service).maybeSingle(),
    'api_alert_state',
  ),
  creerEtat: (service) => avecDelai(
    supabaseAdmin.from('api_alert_state').upsert({ service }, { onConflict: 'service', ignoreDuplicates: true }),
    'api_alert_state',
  ),
  prendreCreneau: async (service, precedent, nouveau) => {
    let requete = supabaseAdmin.from('api_alert_state').update({ last_alert_at: nouveau }).eq('service', service);
    requete = precedent ? requete.eq('last_alert_at', precedent) : requete.is('last_alert_at', null);
    const data = await avecDelai(requete.select('service'), 'api_alert_state');
    return (data || []).length === 1;
  },
  rendreCreneau: (service, nouveau, precedent) => avecDelai(
    supabaseAdmin.from('api_alert_state').update({ last_alert_at: precedent }).eq('service', service).eq('last_alert_at', nouveau),
    'api_alert_state',
  ),
  echecsNonSignales: async () => {
    const depuis = new Date(Date.now() - 7 * 86400000).toISOString();
    const data = await avecDelai(
      supabaseAdmin.from('api_error_logs').select('id, service')
        .eq('final_status', 'failed').eq('alert_sent', false).gte('created_at', depuis)
        .order('id', { ascending: false }).limit(500),
      'api_error_logs',
    );
    return data || [];
  },
  marquerSignales: async (ids) => {
    if (!ids.length) return;
    await avecDelai(supabaseAdmin.from('api_error_logs').update({ alert_sent: true }).in('id', ids), 'api_error_logs');
  },
};

// Fetch direct, jamais apiFetch : un échec de Brevo ne doit pas relancer une alerte sur l'alerte.
async function envoyerAlerte(alerte) {
  const { sujet, html } = contenuAlerte(alerte, { appUrl: JOURNAL_URL });
  const init = {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: 'Myracoustic' }],
      subject: sujet,
      htmlContent: html,
    }),
  };
  // Notre lien « Se désabonner » à la place de celui de Brevo (sans effet pour notre boîte).
  const res = await fetch('https://api.brevo.com/v3/smtp/email',
    avecLienDesabonnement(init, lireEnvoi(init), { secret: process.env.SUPABASE_SERVICE_ROLE_KEY }));
  await res.body?.cancel().catch(() => {}); // corps inutile : libère la connexion
  if (!res.ok) throw new Error(`Brevo ${res.status}`);
}

const alerter = creerAlerteur({ store, envoyer: envoyerAlerte });

async function journaliserEtAlerter(ligne) {
  const resume = `[api-externe] ${nomService(ligne.service)} ${ligne.method} ${ligne.endpoint} → ${ligne.status_code ?? ligne.error_type}`
    + ` · ${ligne.attempts} tentative(s) · ${ligne.final_status === 'resolved' ? 'résolu après relance' : 'échec définitif'}`;
  if (ligne.final_status === 'resolved') console.warn(resume);
  else console.error(resume);

  try {
    await avecDelai(supabaseAdmin.from('api_error_logs').insert(ligne), 'api_error_logs');
  } catch (err) {
    console.error('[api-externe] journal non enregistré :', err.message);
  }
  if (ligne.final_status !== 'failed') return;
  try {
    const r = await alerter(ligne);
    if (r.raison === 'envoi') console.error('[api-externe] alerte e-mail non envoyée :', r.erreur?.message);
  } catch (err) {
    console.error('[api-externe] alerte impossible :', err.message);
  }
}

// Suivi lancé après la réponse (after) ; hors requête, lancé en parallèle. Jamais attendu.
function planifier(tache) {
  const lancer = () => tache().catch((err) => console.error('[api-externe] suivi en échec :', err.message));
  try {
    after(lancer);
  } catch {
    lancer();
  }
}

const appels = creerAppelsExternes({
  app: APP,
  secrets: secretsConnus,
  signaler: (ligne) => planifier(() => journaliserEtAlerter(ligne)),
});

/*
 * Tout envoi d'e-mail par Brevo passe par ici (app/lib/desabonnement-core.js) :
 * - une relance ou un conseil (envoi marqué `relance`) ne part pas vers une adresse désabonnée :
 *   la tâche reçoit une réponse de la forme d'un envoi réussi et n'y revient pas ;
 * - tous les autres partent, avec notre lien « Se désabonner » à la place de celui de Brevo.
 * Les autres appels (lectures chez Brevo, autres services) ne sont pas touchés.
 */
export async function apiFetch(service, url, init = {}, options = {}) {
  const envoi = estEnvoiBrevo(service, url, init) ? lireEnvoi(init) : null;
  if (!envoi) return appels.apiFetch(service, url, init, options);
  if (envoi.relance && await estDesabonne(envoi.destinataire)) {
    console.info('[desabonnement] relance non envoyée : adresse désabonnée');
    return reponseEnvoiIgnore();
  }
  return appels.apiFetch(service, url, avecLienDesabonnement(init, envoi, { secret: process.env.SUPABASE_SERVICE_ROLE_KEY }), options);
}
export const apiSdk = appels.apiSdk;
