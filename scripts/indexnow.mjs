#!/usr/bin/env node
/* IndexNow : prévient Bing (et les autres moteurs du protocole : Yandex, Seznam, Naver…) qu'une
   page publique a changé, pour qu'il la relise vite. ChatGPT et Copilot s'appuient en partie sur Bing.
   Protocole : https://www.indexnow.org/documentation — un seul envoi est partagé entre les moteurs.

   La clé n'est pas un secret : elle est publiée dans public/<clé>.txt pour prouver qu'on est le site.

   Utilisation :
     node scripts/indexnow.mjs --diff <commit-avant> <commit-après> [--attendre] [--essai]
         pages dont la date `modifie` de app/sitemap.js a changé entre les deux commits
         (c'est ce que lance .github/workflows/indexnow.yml à chaque push qui touche le sitemap)
     node scripts/indexnow.mjs --depuis 2026-11-19 [--attendre] [--essai]
         pages dont la date `modifie` est à partir de cette date
     node scripts/indexnow.mjs https://myracoustic.com/page-1 https://myracoustic.com/page-2 [--essai]
         adresses précises
   --attendre : attend que le site en ligne affiche les nouvelles dates (fin du déploiement Vercel)
                avant d'envoyer, 10 minutes au plus.
   --essai    : affiche ce qui serait envoyé, sans rien envoyer. */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const HOTE = 'myracoustic.com';
const BASE = `https://${HOTE}`;
const CLE = '1aee8dd44c9ad1a30e012cc07e43d525';
const ADRESSE_CLE = `${BASE}/${CLE}.txt`;
const ENVOI = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const essai = args.includes('--essai');
const attendre = args.includes('--attendre');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// { '/chemin': 'AAAA-MM-JJ' } à partir du texte de app/sitemap.js (sans l'exécuter).
function lireDates(texte) {
  const dates = {};
  for (const m of texte.matchAll(/path:\s*'([^']+)',\s*modifie:\s*'(\d{4}-\d{2}-\d{2})'/g)) dates[m[1]] = m[2];
  return dates;
}

function sitemapAuCommit(commit) {
  try {
    return execFileSync('git', ['show', `${commit}:app/sitemap.js`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null; // commit inconnu (premier push d'une branche, historique incomplet…)
  }
}

let pages = []; // [{ url, date }]
const iDiff = args.indexOf('--diff');
const iDepuis = args.indexOf('--depuis');
const actuelles = lireDates(readFileSync(new URL('../app/sitemap.js', import.meta.url), 'utf8'));

if (iDiff !== -1) {
  const [avant, apres] = [args[iDiff + 1], args[iDiff + 2]];
  const texteApres = sitemapAuCommit(apres) ?? readFileSync(new URL('../app/sitemap.js', import.meta.url), 'utf8');
  const texteAvant = /^0+$/.test(avant || '') ? null : sitemapAuCommit(avant);
  const datesApres = lireDates(texteApres);
  if (!texteAvant) {
    console.log("Commit précédent introuvable : rien n'est envoyé (relancer avec --depuis si besoin).");
    process.exit(0);
  }
  const datesAvant = lireDates(texteAvant);
  pages = Object.entries(datesApres)
    .filter(([chemin, date]) => datesAvant[chemin] !== date)
    .map(([chemin, date]) => ({ url: `${BASE}${chemin === '/' ? '/' : chemin}`, date }));
} else if (iDepuis !== -1) {
  const depuis = args[iDepuis + 1];
  pages = Object.entries(actuelles)
    .filter(([, date]) => date >= depuis)
    .map(([chemin, date]) => ({ url: `${BASE}${chemin}`, date }));
} else {
  pages = args.filter((a) => a.startsWith('http')).map((url) => ({ url, date: null }));
}

if (pages.length === 0) {
  console.log('Aucune page modifiée : rien à envoyer.');
  process.exit(0);
}
const horsSite = pages.filter((p) => new URL(p.url).host !== HOTE);
if (horsSite.length) {
  console.error('Adresses hors de myracoustic.com refusées :', horsSite.map((p) => p.url).join(', '));
  process.exit(1);
}

// Attendre que le site en ligne serve les nouvelles dates (sinon Bing relirait l'ancienne version).
if (attendre) {
  const attendues = pages.filter((p) => p.date);
  const debut = Date.now();
  for (;;) {
    let enLigne = {};
    try {
      const xml = await (await fetch(`${BASE}/sitemap.xml`, { cache: 'no-store' })).text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) enLigne[m[1]] = m[2].slice(0, 10);
    } catch { enLigne = {}; }
    const enRetard = attendues.filter((p) => enLigne[p.url] !== p.date);
    if (enRetard.length === 0) break;
    if (Date.now() - debut > 10 * 60 * 1000) {
      console.error('Le site en ligne ne montre toujours pas les nouvelles dates après 10 minutes :', enRetard.map((p) => p.url).join(', '));
      process.exit(1);
    }
    await pause(20000);
  }
  console.log('Site en ligne à jour.');
}

const urlList = pages.map((p) => p.url);
console.log(`${urlList.length} page(s) à signaler :\n  ${urlList.join('\n  ')}`);
if (essai) {
  console.log('Essai : rien envoyé.');
  process.exit(0);
}

const reponse = await fetch(ENVOI, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOTE, key: CLE, keyLocation: ADRESSE_CLE, urlList }),
});
const SENS = {
  200: 'reçu',
  202: 'reçu, vérification de la clé en cours',
  400: 'format invalide',
  403: 'clé refusée (fichier de clé introuvable ou différent)',
  422: "adresses hors du site, ou clé non conforme",
  429: 'trop de demandes, réessayer plus tard',
};
console.log(`IndexNow : ${reponse.status} (${SENS[reponse.status] || 'réponse inattendue'})`);
process.exit(reponse.status === 200 || reponse.status === 202 ? 0 : 1);
