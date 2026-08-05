/**
 * Script de ré-autorisation Google Calendar (accès complet lecture + écriture) — à lancer une seule fois.
 * Nécessaire car le jeton actuel n'a que le droit de lecture : la création/suppression
 * d'événements (calendrier d'appel, synchro Qonto) échoue avec "insufficient authentication scopes".
 *
 * Usage (depuis le dossier site/) :
 *   node --env-file=.env.local scripts/google-calendar-auth.mjs
 *
 * Utilise GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET déjà présents dans .env.local.
 *
 * Prérequis : http://localhost:8899/oauth2callback doit être une URI de redirection
 * autorisée pour ce client OAuth. Si l'étape d'autorisation renvoie une erreur
 * "redirect_uri_mismatch", ajoutez cette URI dans Google Cloud Console →
 * APIs & Services → Identifiants → cliquez sur le client OAuth utilisé →
 * "URI de redirection autorisées" → Enregistrer, puis relancez ce script.
 */
import http from 'http';
import { URL } from 'url';
import { google } from 'googleapis';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:8899/oauth2callback';
const SCOPES        = ['https://www.googleapis.com/auth/calendar'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Erreur : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis.');
  console.error('Lancez avec : node --env-file=.env.local scripts/google-calendar-auth.mjs');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // force un nouveau refresh_token même si déjà autorisé par le passé
  scope: SCOPES,
});

console.log('\n─────────────────────────────────────────────');
console.log('  Ré-autorisation Google Calendar (accès complet)');
console.log('─────────────────────────────────────────────');
console.log('\n  Ouvrez ce lien, connectez-vous avec le compte Google qui gère');
console.log('  l\'agenda Myracoustic, et acceptez les permissions demandées :\n');
console.log(' ', authUrl);
console.log('\n  En attente du retour…\n');

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:8899');
    if (url.pathname !== '/oauth2callback') { res.writeHead(204); res.end(); return; }

    const code  = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.end(`<h2>Erreur : ${error}</h2><p>Vous pouvez fermer cet onglet.</p>`);
      server.close();
      reject(new Error('Google auth error: ' + error));
      return;
    }

    res.end('<h2 style="font-family:sans-serif;color:green">Autorisation réussie !</h2><p>Vous pouvez fermer cet onglet et revenir au terminal.</p>');
    server.close();
    resolve(code);
  });
  server.listen(8899);
  server.on('error', reject);
});

const { tokens } = await oauth2Client.getToken(code);

console.log('\n─────────────────────────────────────────────');
if (!tokens.refresh_token) {
  console.log('  Aucun refresh_token reçu.');
  console.log('  Ça arrive si ce compte Google avait déjà autorisé cette appli récemment.');
  console.log('  Révoquez d\'abord l\'accès ici, puis relancez ce script :');
  console.log('  https://myaccount.google.com/permissions');
} else {
  console.log('  Autorisation réussie ! Copiez cette ligne dans Vercel');
  console.log('  (Settings -> Environment Variables -> GOOGLE_REFRESH_TOKEN)');
  console.log('  et dans votre .env.local local :');
  console.log('─────────────────────────────────────────────\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
}
console.log('\n─────────────────────────────────────────────\n');
