// Tests du module d'appels externes (lib/api-externe-core.js) : relances, nettoyage, alertes.
// Lancer : npm test (outil de test intégré à Node, aucune dépendance). Aucun appel réel : les
// services, l'horloge et les attentes sont simulés.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  creerAppelsExternes, creerAlerteur, contenuAlerte, nettoyerAdresse, nettoyerMessage,
  messageDepuisCorps, attenteAvant, lireRetryAfter, estRelancable,
} from '../app/lib/api-externe-core.js';

// ─── Outils de simulation ───────────────────────────────────────────────────────────────────

function erreurReseau(code) {
  const e = new TypeError('fetch failed');
  e.cause = Object.assign(new Error(code), { code });
  return e;
}

// Service qui ne répond jamais : la demande ne s'arrête que si son signal est annulé.
const pendu = (url, init) => new Promise((_, rejeter) => {
  init.signal.addEventListener('abort', () => rejeter(init.signal.reason));
});

// Réponses successives d'un faux service (la dernière se répète).
function fauxFetch(reponses) {
  const appels = [];
  const fn = async (url, init) => {
    appels.push({ url, init });
    const r = reponses[Math.min(appels.length - 1, reponses.length - 1)];
    if (typeof r === 'function') return r(url, init);
    if (r instanceof Error) throw r;
    return new Response(r.body === undefined ? '{}' : r.body, { status: r.status ?? 200, headers: r.headers });
  };
  fn.appels = appels;
  return fn;
}

function banc(reponses, extra = {}) {
  const signales = [];
  const attentes = [];
  const fetch = fauxFetch(reponses);
  const { apiFetch, apiSdk } = creerAppelsExternes({
    fetch,
    attendre: async (ms) => { attentes.push(ms); },
    aleatoire: () => 0.5, // variation neutre : attentes exactes
    signaler: async (ligne) => { signales.push(ligne); },
    ...extra,
  });
  return { apiFetch, apiSdk, fetch, signales, attentes };
}

const URL_QONTO = 'https://thirdparty.qonto.com/v2/quotes/8f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f';
const URL_BREVO = 'https://api.brevo.com/v3/smtp/email';

// ─── Relances ───────────────────────────────────────────────────────────────────────────────

describe('relances', () => {
  test('succès du premier coup : un seul appel, rien de signalé', async () => {
    const b = banc([{ status: 200, body: '{"ok":true}' }]);
    const res = await b.apiFetch('qonto', URL_QONTO);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(b.fetch.appels.length, 1);
    assert.equal(b.signales.length, 0);
  });

  test('lecture en 503 puis 200 : relancée et notée « résolue après relance »', async () => {
    const b = banc([{ status: 503 }, { status: 200 }]);
    const res = await b.apiFetch('qonto', URL_QONTO);
    assert.equal(res.status, 200);
    assert.equal(b.fetch.appels.length, 2);
    assert.deepEqual(b.attentes, [500]);
    assert.equal(b.signales.length, 1);
    assert.equal(b.signales[0].final_status, 'resolved');
    assert.equal(b.signales[0].attempts, 2);
    assert.equal(b.signales[0].status_code, 503);
  });

  test('lecture en 500 trois fois : 3 tentatives, attentes 0,5 s puis 1,5 s, échec définitif', async () => {
    const b = banc([{ status: 500, body: '{"errors":[{"code":"internal","detail":"Erreur interne"}]}' }]);
    const res = await b.apiFetch('qonto', URL_QONTO);
    assert.equal(b.fetch.appels.length, 3);
    assert.deepEqual(b.attentes, [500, 1500]);
    assert.equal(b.signales.length, 1);
    const l = b.signales[0];
    assert.equal(l.final_status, 'failed');
    assert.equal(l.attempts, 3);
    assert.equal(l.status_code, 500);
    assert.equal(l.error_type, 'http');
    assert.equal(l.message, 'internal — Erreur interne');
    // Le code appelant reçoit la réponse en erreur, intacte, comme avec fetch.
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { errors: [{ code: 'internal', detail: 'Erreur interne' }] });
  });

  for (const status of [400, 401, 403, 404, 409, 422]) {
    test(`erreur ${status} définitive : jamais relancée, notée en échec`, async () => {
      const b = banc([{ status }]);
      const res = await b.apiFetch('qonto', URL_QONTO);
      assert.equal(res.status, status);
      assert.equal(b.fetch.appels.length, 1);
      assert.equal(b.signales[0].final_status, 'failed');
      assert.equal(b.signales[0].attempts, 1);
    });
  }

  test('statut normal déclaré (404 attendu) : ni relance ni journal', async () => {
    const b = banc([{ status: 404 }]);
    const res = await b.apiFetch('deezer', 'https://api.deezer.com/track/123', {}, { statutsNormaux: [404] });
    assert.equal(res.status, 404);
    assert.equal(b.fetch.appels.length, 1);
    assert.equal(b.signales.length, 0);
  });

  test('création (POST) en 500 : pas de relance, pour ne pas créer de doublon', async () => {
    const b = banc([{ status: 500 }, { status: 200 }]);
    const res = await b.apiFetch('brevo', URL_BREVO, { method: 'POST', body: '{}' });
    assert.equal(res.status, 500);
    assert.equal(b.fetch.appels.length, 1);
    assert.equal(b.signales[0].final_status, 'failed');
  });

  for (const status of [429, 503]) {
    test(`création (POST) en ${status} : relancée (la demande a été refusée, rien n’a été fait)`, async () => {
      const b = banc([{ status }, { status: 201 }]);
      const res = await b.apiFetch('qonto', 'https://thirdparty.qonto.com/v2/client_invoices', { method: 'POST', body: '{}' });
      assert.equal(res.status, 201);
      assert.equal(b.fetch.appels.length, 2);
      assert.equal(b.signales[0].final_status, 'resolved');
    });
  }

  test('création : connexion refusée relancée, connexion coupée en cours de route non relancée', async () => {
    const refusee = banc([erreurReseau('ECONNREFUSED'), { status: 201 }]);
    const res = await refusee.apiFetch('brevo', URL_BREVO, { method: 'POST' });
    assert.equal(res.status, 201);
    assert.equal(refusee.fetch.appels.length, 2);

    const coupee = banc([erreurReseau('ECONNRESET'), { status: 201 }]);
    await assert.rejects(coupee.apiFetch('brevo', URL_BREVO, { method: 'POST' }), /fetch failed/);
    assert.equal(coupee.fetch.appels.length, 1);
    assert.equal(coupee.signales[0].error_type, 'network');
    assert.equal(coupee.signales[0].message, 'Connexion impossible (ECONNRESET)');
  });

  test('délai dépassé : relancé pour une lecture, pas pour une création', async () => {
    const lecture = banc([pendu]);
    await assert.rejects(lecture.apiFetch('qonto', URL_QONTO, {}, { delaiMs: 20 }), { name: 'TimeoutError' });
    assert.equal(lecture.fetch.appels.length, 3);
    assert.equal(lecture.signales[0].error_type, 'timeout');
    assert.equal(lecture.signales[0].final_status, 'failed');

    const creation = banc([pendu]);
    await assert.rejects(creation.apiFetch('brevo', URL_BREVO, { method: 'POST' }, { delaiMs: 20 }), { name: 'TimeoutError' });
    assert.equal(creation.fetch.appels.length, 1);
  });

  test('rejouable: true : un POST de simple lecture (ex. disponibilités Google) se relance comme une lecture', async () => {
    const b = banc([{ status: 500 }, { status: 200 }]);
    const res = await b.apiFetch('qonto', URL_QONTO, { method: 'POST' }, { rejouable: true });
    assert.equal(res.status, 200);
    assert.equal(b.fetch.appels.length, 2);
  });

  test('attente de base réglable (Tidal : 1,5 s puis 4,5 s)', async () => {
    const b = banc([{ status: 429 }, { status: 429 }, { status: 200 }]);
    const res = await b.apiFetch('tidal', 'https://openapi.tidal.com/v2/searchResults', {}, { attenteBaseMs: 1500, budgetMs: 45000 });
    assert.equal(res.status, 200);
    assert.deepEqual(b.attentes, [1500, 4500]);
  });

  test('Retry-After respecté, et plafonné à 5 s', async () => {
    const court = banc([{ status: 429, headers: { 'Retry-After': '2' } }, { status: 200 }]);
    await court.apiFetch('mollie', 'https://api.mollie.com/v2/payments');
    assert.deepEqual(court.attentes, [2000]);

    const long = banc([{ status: 429, headers: { 'Retry-After': '120' } }, { status: 200 }]);
    await long.apiFetch('mollie', 'https://api.mollie.com/v2/payments');
    assert.deepEqual(long.attentes, [5000]);
  });

  test('erreur réseau définitive : l’erreur d’origine remonte au code appelant, comme avec fetch', async () => {
    const erreur = erreurReseau('ENOTFOUND');
    const b = banc([erreur]);
    await assert.rejects(b.apiFetch('qonto', URL_QONTO), (e) => e === erreur);
    assert.equal(b.fetch.appels.length, 3);
    assert.equal(b.signales[0].message, 'Connexion impossible (ENOTFOUND)');
  });

  test('annulation par le code appelant : arrêt immédiat, rien de relancé ni signalé', async () => {
    const b = banc([pendu]);
    const controleur = new AbortController();
    setTimeout(() => controleur.abort(), 5);
    await assert.rejects(b.apiFetch('tidal', 'https://openapi.tidal.com/v2/playlists', { signal: controleur.signal }, { delaiMs: 1000 }));
    assert.equal(b.fetch.appels.length, 1);
    assert.equal(b.signales.length, 0);
  });

  test('délai posé par le code appelant (AbortSignal.timeout) : enregistré comme délai dépassé', async () => {
    const b = banc([pendu]);
    await assert.rejects(
      b.apiFetch('tidal', 'https://openapi.tidal.com/v2/playlists', { signal: AbortSignal.timeout(20) }, { delaiMs: 1000 }),
      { name: 'TimeoutError' },
    );
    assert.equal(b.fetch.appels.length, 1); // ce signal reste expiré : relance impossible
    assert.equal(b.signales.length, 1);
    assert.equal(b.signales[0].error_type, 'timeout');
    assert.equal(b.signales[0].final_status, 'failed');
  });

  test('erreur de programmation (adresse mal écrite) : remontée telle quelle, ni relance ni journal', async () => {
    const erreur = new TypeError('Failed to parse URL from pas une adresse', { cause: Object.assign(new TypeError('Invalid URL'), { code: 'ERR_INVALID_URL' }) });
    const b = banc([erreur]);
    await assert.rejects(b.apiFetch('qonto', 'pas une adresse'), (e) => e === erreur);
    assert.equal(b.fetch.appels.length, 1);
    assert.equal(b.signales.length, 0);
  });

  test('vraie connexion refusée (port fermé de cette machine) : reconnue et relancée, même pour une création', async () => {
    const signales = [];
    const { apiFetch } = creerAppelsExternes({ attendre: async () => {}, signaler: async (l) => { signales.push(l); } });
    await assert.rejects(apiFetch('brevo', 'http://127.0.0.1:59999/v3/smtp/email', { method: 'POST' }), /fetch failed/);
    assert.equal(signales[0].attempts, 3);
    assert.equal(signales[0].message, 'Connexion impossible (ECONNREFUSED)');
  });

  test('réponse 304 (pas modifié) : pas un échec', async () => {
    const b = banc([{ status: 304, body: null }]);
    const res = await b.apiFetch('qonto', URL_QONTO);
    assert.equal(res.status, 304);
    assert.equal(b.signales.length, 0);
  });

  test('réponse 4xx : son corps reste lisible par le code appelant après l’enregistrement', async () => {
    const b = banc([{ status: 422, body: '{"errors":[{"code":"invalid"}]}' }]);
    const res = await b.apiFetch('qonto', URL_QONTO, { method: 'POST' });
    assert.deepEqual(await res.json(), { errors: [{ code: 'invalid' }] });
    assert.equal(b.signales[0].message, 'invalid');
  });

  test('durée totale plafonnée : aucune tentative qui dépasserait le budget', async () => {
    const b = banc([pendu]);
    await assert.rejects(b.apiFetch('qonto', URL_QONTO, {}, { delaiMs: 20, budgetMs: 2000 }), { name: 'TimeoutError' });
    // 3e tentative refusée : 1,5 s d'attente + 1 s de marge dépasseraient les 2 s.
    assert.equal(b.fetch.appels.length, 2);
    assert.equal(b.signales[0].attempts, 2);
    assert.equal(b.signales[0].final_status, 'failed');
  });

  test('bibliothèque Google : coupure réseau relancée, bug (ni code HTTP ni code réseau) remonté sans relance ni journal', async () => {
    const b = banc([]);
    let n = 0;
    const valeur = await b.apiSdk('google-agenda', 'events.list', async () => {
      n++;
      if (n === 1) throw Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
      return 'ok';
    });
    assert.equal(valeur, 'ok');
    assert.equal(b.signales[0].error_type, 'network');

    const bug = new TypeError('Cannot read properties of undefined');
    let essais = 0;
    await assert.rejects(b.apiSdk('google-agenda', 'events.list', async () => { essais++; throw bug; }), (e) => e === bug);
    assert.equal(essais, 1);
    assert.equal(b.signales.length, 1);
  });

  test('delaiCouvreCorps : une réponse dont le corps n’en finit pas est coupée, comme avec l’ancien AbortSignal.timeout', async () => {
    // En-têtes reçus tout de suite, corps qui ne se termine jamais (sauf si la demande est annulée).
    const corpsSansFin = (url, init) => new Response(new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('{"debut":'));
        init.signal.addEventListener('abort', () => c.error(init.signal.reason));
      },
    }));
    const avec = banc([corpsSansFin]);
    const res = await avec.apiFetch('deezer', 'https://api.deezer.com/search', {}, { delaiMs: 20, delaiCouvreCorps: true });
    await assert.rejects(res.text(), { name: 'TimeoutError' });

    const sans = banc([corpsSansFin]);
    const res2 = await sans.apiFetch('qonto', URL_QONTO, {}, { delaiMs: 20 });
    const issue = await Promise.race([res2.text().then(() => 'fini', () => 'coupé'), new Promise((r) => setTimeout(() => r('en attente'), 80))]);
    assert.equal(issue, 'en attente'); // sans l'option : le délai s'arrête aux en-têtes (comportement d'avant pour ces appels)
    res2.body.cancel().catch(() => {});
  });

  test('bibliothèque Google : une relance n’est lancée que si elle peut tenir en entier dans la durée totale', async () => {
    const panne = () => { throw Object.assign(new Error('Backend Error'), { status: 503 }); };
    const large = banc([]);
    let essais = 0;
    await assert.rejects(large.apiSdk('google-agenda', 'calendar.freebusy.query', async () => { essais++; panne(); }, { methode: 'POST', rejouable: true }));
    assert.equal(essais, 3); // 15 s possibles par tentative, 25 s au total : les erreurs rapides sont relancées

    const serre = banc([]);
    essais = 0;
    await assert.rejects(serre.apiSdk('google-agenda', 'calendar.freebusy.query', async () => { essais++; panne(); }, { methode: 'POST', rejouable: true, budgetMs: 15000 }));
    assert.equal(essais, 1); // une 2e tentative de 15 s ne tiendrait pas dans 15 s
  });

  test('un signalement qui plante ne casse jamais l’appel', async (t) => {
    t.mock.method(console, 'error', () => {});
    const b = banc([{ status: 503 }, { status: 200 }], { signaler: async () => { throw new Error('base en panne'); } });
    const res = await b.apiFetch('qonto', URL_QONTO);
    assert.equal(res.status, 200);
  });

  test('bibliothèque Google : 503 puis succès = résolu ; erreur attendue relancée sans journal ; échec définitif relancé tel quel', async () => {
    const b = banc([]);
    let n = 0;
    const valeur = await b.apiSdk('google-agenda', 'events.list', async () => {
      n++;
      if (n === 1) throw Object.assign(new Error('Backend Error'), { status: 503 });
      return { data: { items: [] } };
    });
    assert.deepEqual(valeur, { data: { items: [] } });
    assert.equal(b.signales[0].final_status, 'resolved');
    assert.equal(b.signales[0].endpoint, 'events.list');

    const introuvable = Object.assign(new Error('Not Found'), { status: 404 });
    await assert.rejects(b.apiSdk('google-agenda', 'events.delete', async () => { throw introuvable; }, { methode: 'DELETE', statutsNormaux: [404, 410] }), (e) => e === introuvable);
    assert.equal(b.signales.length, 1);

    const refus = Object.assign(new Error('Invalid Credentials'), { status: 401 });
    let essais = 0;
    await assert.rejects(b.apiSdk('google-agenda', 'events.insert', async () => { essais++; throw refus; }, { methode: 'POST' }), (e) => e === refus);
    assert.equal(essais, 1);
    assert.equal(b.signales[1].final_status, 'failed');
    assert.equal(b.signales[1].status_code, 401);
  });
});

describe('règles de relance et attentes', () => {
  test('tableau des décisions', () => {
    assert.equal(estRelancable({ type: 'http', status: 500 }, true), true);
    assert.equal(estRelancable({ type: 'http', status: 500 }, false), false);
    assert.equal(estRelancable({ type: 'http', status: 502 }, false), false);
    assert.equal(estRelancable({ type: 'http', status: 503 }, false), true);
    assert.equal(estRelancable({ type: 'http', status: 429 }, false), true);
    assert.equal(estRelancable({ type: 'http', status: 408 }, true), true);
    assert.equal(estRelancable({ type: 'http', status: 404 }, true), false);
    assert.equal(estRelancable({ type: 'timeout' }, true), true);
    assert.equal(estRelancable({ type: 'timeout' }, false), false);
    assert.equal(estRelancable({ type: 'network', code: 'ECONNRESET' }, true), true);
    assert.equal(estRelancable({ type: 'network', code: 'UND_ERR_CONNECT_TIMEOUT' }, false), true);
  });

  test('attente croissante avec variation de ± 20 %', () => {
    assert.equal(attenteAvant(2, { aleatoire: () => 0 }), 400);
    assert.equal(attenteAvant(2, { aleatoire: () => 1 }), 600);
    assert.equal(attenteAvant(3, { aleatoire: () => 0.5 }), 1500);
  });

  test('Retry-After en secondes ou en date', () => {
    assert.equal(lireRetryAfter('3'), 3000);
    assert.equal(lireRetryAfter(null), null);
    const maintenant = Date.parse('2026-11-22T10:00:00Z');
    assert.equal(lireRetryAfter('Sun, 22 Nov 2026 10:00:04 GMT', maintenant), 4000);
  });
});

// ─── Rien de personnel ni de secret dans le journal ─────────────────────────────────────────

describe('nettoyage', () => {
  test('adresse : paramètres retirés (clé Mapbox, e-mail), identifiants et adresses postales remplacés', () => {
    assert.equal(
      nettoyerAdresse('https://api.mapbox.com/geocoding/v5/mapbox.places/12%20rue%20de%20la%20Paix%20Nantes.json?access_token=pk.secret123&country=fr'),
      'api.mapbox.com/geocoding/v5/mapbox.places/:id',
    );
    assert.equal(nettoyerAdresse('https://thirdparty.qonto.com/v2/clients?q=jean.dupont%40gmail.com&per_page=50'), 'thirdparty.qonto.com/v2/clients');
    assert.equal(nettoyerAdresse(URL_QONTO), 'thirdparty.qonto.com/v2/quotes/:id');
    assert.equal(nettoyerAdresse('https://api.brevo.com/v3/smtp/email'), 'api.brevo.com/v3/smtp/email');
    assert.equal(nettoyerAdresse('https://api.deezer.com/track/3135556'), 'api.deezer.com/track/:id');
    assert.equal(nettoyerAdresse('https://api.mapbox.com/directions/v5/mapbox/driving/-1.55,47.21;-1.60,47.30'), 'api.mapbox.com/directions/v5/mapbox/driving/:id');
    assert.equal(nettoyerAdresse('https://api.mollie.com/v2/payments/tr_WDqYK6vllg'), 'api.mollie.com/v2/payments/:id');
    assert.equal(nettoyerAdresse('https://api.pwnedpasswords.com/range/ABCDE'), 'api.pwnedpasswords.com/range/:id');
    assert.equal(nettoyerAdresse('pas une adresse'), 'adresse illisible');
  });

  test('adresses postales et numéros étrangers masqués', () => {
    const m = nettoyerMessage('Client à 12 rue de la Paix, 44000 Nantes, +44 7911 123456');
    for (const fuite of ['rue de la Paix', '44000', 'Nantes', '7911']) assert.ok(!m.includes(fuite), `fuite : ${fuite} dans « ${m} »`);
  });

  test('coupe sans abîmer un émoji, caractère nul retiré (sinon la base refuserait la ligne)', () => {
    const m = nettoyerMessage(`${'a'.repeat(298)}😀😀😀${'b'.repeat(10)}`);
    assert.equal(Array.from(m).length, 300);
    assert.ok(m.isWellFormed());
    assert.equal(nettoyerMessage('a\u0000b'), 'ab');
  });

  test('message : e-mails, téléphones, IBAN, clés et secrets masqués', () => {
    const m = nettoyerMessage(
      'Client jean.dupont@gmail.com (06 12 34 56 78, +33 6 12 34 56 78) IBAN FR76 3000 6000 0112 3456 7890 189 '
      + 'Authorization: Bearer abc.def.ghi clé sk_live_ABCDEFGH SIRET 12345678901234 jeton '
      + 'aZ9xQ2mN7pL4kJ8hG3fD6sA1qW5eR0tY',
      ['sk_live_ABCDEFGH'],
    );
    for (const fuite of ['jean.dupont', '06 12', '+33 6', 'FR76', 'abc.def', 'sk_live', '12345678901234', 'aZ9xQ2']) {
      assert.ok(!m.includes(fuite), `fuite : ${fuite} dans « ${m} »`);
    }
    assert.match(m, /\[e-mail\]/);
    assert.match(m, /\[téléphone\]/);
    assert.match(m, /\[iban\]/);
  });

  test('un long code d’erreur en lettres reste lisible (seules les suites lettres + chiffres sont masquées)', () => {
    assert.equal(nettoyerMessage('client_invoice_payment_method_not_allowed'), 'client_invoice_payment_method_not_allowed');
    assert.equal(nettoyerMessage('jeton 8f1c2d3e4b5a4c6d8e7f9a0b1c2d3e4f'), 'jeton [masqué]');
  });

  test('libellés trop longs bornés aux tailles de la table', async () => {
    const b = banc([]);
    await assert.rejects(b.apiSdk('x'.repeat(60), 'e'.repeat(400), async () => { throw Object.assign(new Error('Bad'), { status: 400 }); }));
    assert.equal(b.signales[0].service.length, 40);
    assert.equal(b.signales[0].endpoint.length, 300);
  });

  test('masquage renforcé : e-mail encodé, champs de nom et d’adresse, ville en minuscules', () => {
    const m = nettoyerMessage('to=jean.dupont%40gmail.com "last_name": "Dupont", nom=\'Marie\' address: "4 bis la haute" 44390 nort-sur-erdre');
    for (const fuite of ['jean.dupont', 'Dupont', 'Marie', '4 bis la haute', '44390', 'nort-sur-erdre']) {
      assert.ok(!m.includes(fuite), `fuite : ${fuite} dans « ${m} »`);
    }
  });

  test('corps d’erreur qui n’est pas du JSON : jamais recopié', () => {
    assert.equal(messageDepuisCorps('<html><body>Bonjour Jean Dupont, erreur interne</body></html>'), null);
    assert.equal(messageDepuisCorps('Internal error for client Jean Dupont'), null);
  });

  test('message coupé à 300 caractères, balises HTML retirées', () => {
    assert.equal(nettoyerMessage('x '.repeat(400)).length, 300);
    assert.equal(nettoyerMessage('<html><body><h1>502 Bad Gateway</h1></body></html>'), '502 Bad Gateway');
    assert.equal(nettoyerMessage(''), null);
  });

  test('réponse en erreur : seuls les champs d’erreur sont gardés, jamais les données envoyées', () => {
    const corps = JSON.stringify({
      errors: [{ code: 'invalid', detail: 'billing_address is invalid' }],
      client: { first_name: 'Jean', last_name: 'Dupont', email: 'jean@x.fr' },
    });
    assert.equal(messageDepuisCorps(corps), 'invalid — billing_address is invalid');
    assert.equal(messageDepuisCorps(JSON.stringify({ client: { name: 'Jean Dupont' } })), null);
    assert.equal(messageDepuisCorps('{"code":"unauthorized","message":"Key not found"}'), 'unauthorized — Key not found');
  });

  test('de bout en bout : la ligne enregistrée ne contient aucune donnée du client', async () => {
    const corps = JSON.stringify({ message: 'Invalid email jean.dupont@gmail.com', to: [{ email: 'jean.dupont@gmail.com', name: 'Jean Dupont' }] });
    const b = banc([{ status: 400, body: corps }]);
    await b.apiFetch('brevo', URL_BREVO, { method: 'POST', body: JSON.stringify({ to: [{ email: 'jean.dupont@gmail.com' }] }) });
    const enregistre = JSON.stringify(b.signales[0]);
    assert.ok(!enregistre.includes('jean'), enregistre);
    assert.ok(!enregistre.includes('Dupont'), enregistre);
    assert.equal(b.signales[0].message, 'Invalid email [e-mail]');
  });
});

// ─── Alertes : une par service toutes les 15 minutes au plus ───────────────────────────────

// Même contrat que le vrai stockage (lib/api-externe.js), en mémoire.
function storeMemoire() {
  const etats = new Map();
  const logs = [];
  let prochainId = 1;
  return {
    logs,
    ajouterLog(ligne) { logs.push({ id: prochainId++, service: ligne.service, final_status: ligne.final_status, alert_sent: false }); },
    async lireEtat(s) { return etats.has(s) ? { last_alert_at: etats.get(s) } : null; },
    async creerEtat(s) { if (!etats.has(s)) etats.set(s, null); },
    async prendreCreneau(s, precedent, nouveau) {
      if ((etats.get(s) ?? null) !== precedent) return false;
      etats.set(s, nouveau);
      return true;
    },
    async rendreCreneau(s, nouveau, precedent) { if (etats.get(s) === nouveau) etats.set(s, precedent); },
    async echecsNonSignales() {
      return logs.filter((l) => l.final_status === 'failed' && !l.alert_sent).map(({ id, service }) => ({ id, service }));
    },
    async marquerSignales(ids) { for (const l of logs) if (ids.includes(l.id)) l.alert_sent = true; },
  };
}

function bancAlertes() {
  let horloge = Date.parse('2026-11-22T10:00:00Z');
  let brevoEnPanne = false;
  const store = storeMemoire();
  const envois = [];
  const alerter = creerAlerteur({
    store,
    maintenant: () => horloge,
    envoyer: async (a) => { if (brevoEnPanne) throw new Error('Brevo 503'); envois.push(a); },
  });
  // Même ordre que le vrai module : la ligne est enregistrée, puis l'alerte est décidée.
  const echec = (service, finalStatus = 'failed') => {
    const ligne = { service, final_status: finalStatus, method: 'GET', endpoint: 'x', error_type: 'http', status_code: 503, attempts: 3, message: null };
    store.ajouterLog(ligne);
    return alerter(ligne);
  };
  return {
    echec, envois, store,
    avancer: (minutes) => { horloge += minutes * 60000; },
    panneBrevo: (v) => { brevoEnPanne = v; },
  };
}

describe('alertes', () => {
  test('premier échec définitif : une alerte part', async () => {
    const b = bancAlertes();
    const r = await b.echec('qonto');
    assert.equal(r.envoyee, true);
    assert.equal(b.envois.length, 1);
    assert.equal(b.envois[0].echecsGroupes, 1);
  });

  test('même service dans les 15 minutes : regroupé, pas de nouvel e-mail ; après 15 minutes : une alerte qui compte tout', async () => {
    const b = bancAlertes();
    await b.echec('qonto');
    b.avancer(5);
    assert.equal((await b.echec('qonto')).raison, 'fenetre');
    b.avancer(9);
    assert.equal((await b.echec('qonto')).raison, 'fenetre');
    assert.equal(b.envois.length, 1);
    b.avancer(2); // 16 minutes après la première alerte
    const r = await b.echec('qonto');
    assert.equal(r.envoyee, true);
    assert.equal(b.envois.length, 2);
    assert.equal(b.envois[1].echecsGroupes, 3); // les 2 regroupés + celui-ci
    assert.ok(b.store.logs.every((l) => l.alert_sent));
  });

  test('un autre service pendant la fenêtre reçoit sa propre alerte', async () => {
    const b = bancAlertes();
    await b.echec('qonto');
    b.avancer(1);
    const r = await b.echec('mollie');
    assert.equal(r.envoyee, true);
    assert.deepEqual(b.envois.map((e) => e.service), ['qonto', 'mollie']);
  });

  test('un appel résolu après relance ne déclenche jamais d’alerte', async () => {
    const b = bancAlertes();
    const r = await b.echec('qonto', 'resolved');
    assert.equal(r.envoyee, false);
    assert.equal(b.envois.length, 0);
  });

  test('Brevo en panne : l’alerte est retentée au prochain échec, puis signalée dans la prochaine alerte qui part', async () => {
    const b = bancAlertes();
    b.panneBrevo(true);
    assert.equal((await b.echec('brevo')).raison, 'envoi');
    b.avancer(1);
    assert.equal((await b.echec('brevo')).raison, 'envoi'); // créneau rendu : nouvel essai, pas « fenêtre »
    assert.equal(b.envois.length, 0);

    b.panneBrevo(false);
    b.avancer(1);
    const r = await b.echec('qonto');
    assert.equal(r.envoyee, true);
    assert.deepEqual(b.envois[0].autres, [{ service: 'brevo', echecs: 2 }]);
    assert.ok(b.store.logs.every((l) => l.alert_sent));
  });

  test('deux échecs simultanés du même service : un seul e-mail', async () => {
    const b = bancAlertes();
    const [r1, r2] = await Promise.all([b.echec('qonto'), b.echec('qonto')]);
    assert.equal(b.envois.length, 1);
    assert.deepEqual([r1.envoyee, r2.envoyee].sort(), [false, true]);
  });

  test('contenu de l’e-mail : clair, compté, sans HTML injecté', () => {
    const { sujet, html } = contenuAlerte({
      service: 'qonto', method: 'POST', endpoint: 'thirdparty.qonto.com/v2/client_invoices', status_code: 500, error_type: 'http',
      message: '<script>alert(1)</script> invalid', attempts: 1, quand: Date.parse('2026-11-22T13:05:00Z'),
      echecsGroupes: 3, autres: [{ service: 'brevo', echecs: 2 }], fenetreMinutes: 15,
    });
    assert.equal(sujet, 'Alerte : un appel à Qonto a échoué');
    assert.match(html, /En tout, 3 échecs de Qonto depuis la dernière alerte/);
    assert.match(html, /Brevo \(e-mails\) \(2 échecs non signalés\)/);
    assert.match(html, /ce type d’erreur ne se relance pas/);
    assert.match(html, /22\/11\/2026 14:05/); // heure de Paris
    assert.match(html, /\/admin\/journal-erreurs/);
    assert.ok(!html.includes('<script>'));
  });
});
