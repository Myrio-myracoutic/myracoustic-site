/* Rendez-vous en visio : premier rendez-vous mariage (25/11/2026).
   Fichier PUR (ni Next, ni Supabase, ni réseau), en DEUX exemplaires identiques :
   site/app/lib/rendez-vous-visio.js et plateforme/lib/rendez-vous-visio.js. Le test
   site/tests/copie-identique.test.mjs échoue dès qu'ils divergent : modifier les deux ensemble.
   Contient : quels rendez-vous se font en visio, la demande de lien Google Meet, les liens envoyés
   aux mariés (rejoindre, ajouter à l'agenda), le fichier d'agenda, la fenêtre du rappel « une heure
   avant » et les e-mails. E-mails revus avec ui-ux-pro-max : texte en 16 px, largeur fluide, un seul
   bouton principal de 48 px de haut, liens secondaires discrets, pas d'émoji, charte inchangée. */
import { escapeHtml } from './html-escape.js';

export const PLATEFORME_URL = 'https://app.myracoustic.com';

/* ─── Quels rendez-vous se font en visio ─────────────────────────────────────────────────────── */

// Seul le premier rendez-vous d'une demande mariage. Pros, particuliers et rendez-vous de suivi
// après signature restent au téléphone (choix de Myrio du 24/11).
const KINDS_VISIO = ['mariage'];
export function avecVisio(kind) {
  return KINDS_VISIO.includes(kind);
}

/* ─── Lien Google Meet ───────────────────────────────────────────────────────────────────────── */

// À ajouter au corps de calendar.events.insert, avec le paramètre conferenceDataVersion: 1.
// requestId : identifiant unique de la demande (Google ne crée qu'une salle par identifiant).
export function demandeVisio(requestId) {
  return { conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } } };
}

export function estLienMeet(url) {
  return typeof url === 'string' && /^https:\/\/meet\.google\.com\/[A-Za-z0-9-]+$/.test(url);
}

// Lien de la salle dans l'événement renvoyé par Google, ou null (salle pas créée).
export function lienVisio(evenement) {
  const videos = (evenement?.conferenceData?.entryPoints || [])
    .filter((p) => p?.entryPointType === 'video')
    .map((p) => p.uri);
  return [evenement?.hangoutLink, ...videos].find(estLienMeet) || null;
}

/* ─── Liens envoyés aux mariés ───────────────────────────────────────────────────────────────── */

/* Le bouton « Rejoindre la visio » ne porte jamais le lien Google lui-même : il passe par la
   plateforme, qui mène à la salle du rendez-vous EN COURS. Un ancien e-mail reste donc bon après un
   changement de créneau (l'événement d'agenda, et donc la salle, sont recréés à chaque fois). */
export function lienRejoindre(token, base = PLATEFORME_URL) {
  return `${base}/rendez-vous/${token}/visio`;
}

export function lienIcs(token, base = PLATEFORME_URL) {
  return `${base}/rendez-vous/${token}/agenda`;
}

// La salle s'ouvre jusqu'à 3 h après l'heure prévue ; ensuite le bouton ramène à la page du rendez-vous.
const REJOINDRE_JUSQUA_MS = 3 * 60 * 60 * 1000;
export function peutRejoindre({ debutIso, annule, lien }, maintenantMs = Date.now()) {
  if (!debutIso || annule || !estLienMeet(lien)) return false;
  return maintenantMs < new Date(debutIso).getTime() + REJOINDRE_JUSQUA_MS;
}

/* ─── Ajouter à mon agenda ───────────────────────────────────────────────────────────────────── */

export const TITRE_AGENDA = 'Rendez-vous en visio avec Myracoustic';

function detailsAgenda(rejoindreUrl) {
  return `Pour nous rejoindre le jour venu : ${rejoindreUrl}\nUn souci de connexion ? Nous vous appelons. Myracoustic, 07 68 53 33 08.`;
}

// Heure « naïve » (date + heure de Paris) décalée de quelques minutes, sans passer par un fuseau.
function ajouterMinutes(date, time, minutes) {
  const [a, m, j] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j, h, min + minutes));
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
    time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
  };
}

const compact = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

// Lien « Ajouter à Google Agenda » : date (AAAA-MM-JJ) et heure (HH:MM) de Paris.
export function lienGoogleAgenda({ date, time, dureeMinutes, rejoindreUrl }) {
  const fin = ajouterMinutes(date, time, dureeMinutes);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: TITRE_AGENDA,
    dates: `${compact(date, time)}/${compact(fin.date, fin.time)}`,
    ctz: 'Europe/Paris',
    details: detailsAgenda(rejoindreUrl),
    location: rejoindreUrl,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsTexte = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

// Une ligne de fichier d'agenda ne dépasse pas 75 octets : la suite reprend après « retour + espace ».
function plier(ligne) {
  const encodeur = new TextEncoder();
  const morceaux = [];
  let courant = '';
  let octets = 0;
  for (const c of ligne) {
    const n = encodeur.encode(c).length;
    if (octets + n > 73) { morceaux.push(courant); courant = ''; octets = 1; }
    courant += c;
    octets += n;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

// Fichier d'agenda (.ics) pour Apple, Outlook et les autres. debutIso : heure exacte du rendez-vous (UTC).
export function fichierIcs({ debutIso, dureeMinutes, rejoindreUrl, uid, maintenant = new Date() }) {
  const debut = new Date(debutIso);
  const fin = new Date(debut.getTime() + dureeMinutes * 60000);
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Myracoustic//Rendez-vous//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsDate(maintenant)}`,
    `DTSTART:${icsDate(debut)}`,
    `DTEND:${icsDate(fin)}`,
    `SUMMARY:${icsTexte(TITRE_AGENDA)}`,
    `DESCRIPTION:${icsTexte(detailsAgenda(rejoindreUrl))}`,
    `LOCATION:${icsTexte(rejoindreUrl)}`,
    `URL:${rejoindreUrl}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsTexte(TITRE_AGENDA)}`,
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lignes.map(plier).join('\r\n')}\r\n`;
}

/* ─── Rappel « une heure avant » ─────────────────────────────────────────────────────────────── */

/* La tâche passe une fois par heure (à la minute 15) : elle prend les rendez-vous qui commencent
   entre 30 et 90 minutes plus tard. Un rendez-vous n'entre donc que dans un seul passage, et le
   rappel part entre 30 et 90 minutes avant (45 ou 75 minutes pour des créneaux à l'heure ou à la demie). */
export const RAPPEL_HEURE_MIN_MINUTES = 30;
export const RAPPEL_HEURE_MAX_MINUTES = 90;
export function fenetreRappelHeure(maintenantMs = Date.now()) {
  return {
    debutIso: new Date(maintenantMs + RAPPEL_HEURE_MIN_MINUTES * 60000).toISOString(),
    finIso: new Date(maintenantMs + RAPPEL_HEURE_MAX_MINUTES * 60000).toISOString(),
  };
}

// Rendez-vous pris moins de 2 h avant : la confirmation vient de partir, pas de second e-mail.
export const RAPPEL_HEURE_INUTILE_SOUS_MINUTES = 120;
export function rappelHeureInutile(debutIso, maintenantMs = Date.now()) {
  return new Date(debutIso).getTime() - maintenantMs < RAPPEL_HEURE_INUTILE_SOUS_MINUTES * 60000;
}

// « 17:30 » → « 17h30 », « 9:00 » → « 9h ».
export function heureLisible(time) {
  const [h, m] = String(time).split(':');
  return m === '00' ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`;
}

/* ─── E-mails ────────────────────────────────────────────────────────────────────────────────── */

function cadre({ apercu, corps }) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060e16;font-family:Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${apercu}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1b2a;border-radius:12px;">

  <tr><td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="52" style="height:52px;display:block;margin:0 auto;" />
  </td></tr>

  <tr><td style="padding:32px 32px 8px;">${corps}
    <p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.6;margin:0 0 28px;">
      Myrio<br/><span style="color:rgba(255,255,255,0.65);font-size:14px;">Myracoustic</span>
    </p>
  </td></tr>

  <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
    <p style="color:rgba(255,255,255,0.55);font-size:12px;line-height:1.7;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

const bonjour = (firstName) => {
  const prenom = escapeHtml(firstName || '');
  return `
    <p style="color:#ffffff;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour${prenom ? ` ${prenom}` : ''},</p>`;
};

const titre = (texte) => `
    <h1 style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;margin:0 0 20px;">${texte}</h1>`;

const blocCreneau = (texte) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="background:rgba(184,239,11,0.08);border:1px solid rgba(184,239,11,0.3);border-radius:8px;padding:16px 20px;">
        <p style="color:#b8ef0b;font-size:17px;font-weight:700;line-height:1.4;margin:0;">${escapeHtml(texte).replace(' à ', ' à&nbsp;')}</p>
      </td></tr>
    </table>`;

const paragraphe = (texte) => `
    <p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.7;margin:0 0 24px;">${texte}</p>`;

const bouton = (url, texte) => `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;color:#060e16;font-size:16px;font-weight:700;line-height:20px;text-decoration:none;">${texte}</a>
      </td></tr>
    </table>`;

const lienDiscret = (url, texte) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 0;color:#b8ef0b;font-weight:700;text-decoration:underline;white-space:nowrap;">${texte}</a>`;

const secours = (tel) => `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      Un souci de connexion ? Pas d’inquiétude : nous vous appelons${tel ? ` au <strong style="color:#ffffff;white-space:nowrap;">${escapeHtml(tel)}</strong>` : ''}.
    </p>`;

const changerCreneau = (modifyUrl, question) => (modifyUrl ? `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      ${question}<br/>${lienDiscret(modifyUrl, 'Choisir un autre créneau')}
    </p>` : '');

/* Information sur l'enregistrement (26/11, choix de Myrio) : tous ses rendez-vous sont enregistrés
   (enregistreur Plaud), visio comme téléphone, pour ne rien oublier. On le dit avant, dans la
   confirmation et sur la page du rendez-vous ; la personne peut refuser au début de l'échange. */
export const INFO_ENREGISTREMENT_VISIO = 'Pour ne rien oublier de vos envies, notre échange peut être enregistré. Si vous préférez que non, dites-le-nous au début du rendez-vous.';
export const INFO_ENREGISTREMENT_APPEL = 'Pour ne rien oublier de votre projet, notre échange peut être enregistré. Si vous préférez que non, dites-le-nous au début de l’appel.';

const infoEnregistrement = () => `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">${INFO_ENREGISTREMENT_VISIO}</p>`;

// Questionnaire avant le rendez-vous (25/11) : un seul mot la veille s'il n'est pas rempli, sans
// pression. Le rendez-vous a lieu de toute façon.
const motQuestionnaire = (questionnaireUrl) => (questionnaireUrl ? `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      Un moment d’ici là ? Quelques questions à cocher nous aident à préparer notre rendez-vous. Sinon, aucune importance&nbsp;: nous en parlerons de vive voix.<br/>${lienDiscret(questionnaireUrl, 'Répondre aux questions')}
    </p>` : '');

// « mercredi 2 décembre 2026 à 17h30 » → première lettre en capitale (plus sûr qu'un style d'e-mail).
const capitale = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/* Confirmation (ou changement) d'un rendez-vous en visio. */
export function emailVisioConfirmation({ firstName, slotLabel, tel, rejoindreUrl, googleUrl, icsUrl, modifyUrl, isReschedule = false }) {
  const subject = isReschedule
    ? `Votre rendez-vous en visio est déplacé : ${slotLabel}`
    : `Votre rendez-vous en visio est confirmé : ${slotLabel}`;
  const agenda = googleUrl && icsUrl ? `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0;">Ajouter à mon agenda :</p>
    <p style="font-size:15px;line-height:1.4;margin:0 0 16px;">
      ${lienDiscret(googleUrl, 'Google')}<span style="color:rgba(255,255,255,0.4);padding:0 12px;">·</span>${lienDiscret(icsUrl, 'Apple ou Outlook')}
    </p>` : '';
  const html = cadre({
    apercu: 'Nous avons hâte de découvrir votre mariage.',
    corps: [
      bonjour(firstName),
      titre(isReschedule ? 'Votre rendez-vous en visio est déplacé' : 'Votre rendez-vous en visio est confirmé'),
      blocCreneau(capitale(slotLabel)),
      paragraphe('Nous avons hâte de découvrir votre mariage : vos envies, l’ambiance, les moments qui comptent pour vous. Le jour venu, il suffit de toucher ce bouton.'),
      bouton(rejoindreUrl, 'Rejoindre la visio'),
      `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      Gardez cet e-mail : le bouton vous mènera à notre rendez-vous, sur téléphone comme sur ordinateur.
    </p>`,
      agenda,
      secours(tel),
      infoEnregistrement(),
      changerCreneau(modifyUrl, 'Ce moment ne vous convient plus ?'),
    ].join(''),
  });
  return { subject, html };
}

/* Rappel envoyé la veille. */
export function emailVisioRappelVeille({ firstName, slotLabel, tel, rejoindreUrl, modifyUrl, questionnaireUrl = null }) {
  const html = cadre({
    apercu: 'Demain, il suffit de toucher un bouton pour nous rejoindre.',
    corps: [
      bonjour(firstName),
      titre('Notre rendez-vous en visio, c’est demain'),
      blocCreneau(capitale(slotLabel)),
      paragraphe('Nous avons hâte de vous retrouver pour parler de votre mariage. Demain, il suffit de toucher ce bouton.'),
      bouton(rejoindreUrl, 'Rejoindre la visio'),
      secours(tel),
      motQuestionnaire(questionnaireUrl),
      changerCreneau(modifyUrl, 'Un empêchement ?'),
    ].join(''),
  });
  return { subject: `C’est demain : notre rendez-vous en visio, ${slotLabel}`, html };
}

/* Invitation au questionnaire, envoyée 2 à 3 h après la prise du premier rendez-vous mariage
   (25/11). Chaleureuse, sans pression : rien n'est obligatoire, aucun délai annoncé.
   slotLabel : « mercredi 2 décembre 2026 à 17h30 » (facultatif). */
export function emailQuestionnaire({ firstName, slotLabel = '', questionnaireUrl }) {
  const quand = slotLabel ? escapeHtml(slotLabel).replace(' à ', ' à&nbsp;') : 'lors de notre rendez-vous';
  const html = cadre({
    apercu: 'Quelques questions à cocher, chez vous, quand vous voulez.',
    corps: [
      bonjour(firstName),
      titre('Parlez-nous de votre mariage'),
      paragraphe('Pour que notre rendez-vous vous ressemble, nous avons préparé quelques questions à cocher. Répondez chez vous, à deux si vous le souhaitez, en prenant votre temps&nbsp;: tout s’enregistre au fur et à mesure.'),
      bouton(questionnaireUrl, 'Répondre aux questions'),
      `
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      Aucune question n’est obligatoire. Et si le temps vous manque, aucune importance&nbsp;: nous en parlerons ensemble ${quand}.
    </p>`,
    ].join(''),
  });
  return { subject: 'Avant notre rendez-vous : parlez-nous de votre mariage', html };
}

/* Rappel envoyé environ une heure avant. heure : « 17h30 ». */
export function emailVisioRappelHeure({ firstName, heure, tel, rejoindreUrl, modifyUrl }) {
  const html = cadre({
    apercu: `Nous nous retrouvons en visio à ${heure}.`,
    corps: [
      bonjour(firstName),
      titre(`À tout à l’heure, à ${escapeHtml(heure)}`),
      paragraphe('Installez-vous confortablement : nous nous retrouvons en visio pour parler de votre mariage. À l’heure du rendez-vous, touchez ce bouton.'),
      bouton(rejoindreUrl, 'Rejoindre la visio'),
      secours(tel),
      changerCreneau(modifyUrl, 'Un empêchement ?'),
    ].join(''),
  });
  return { subject: `À tout à l’heure : notre rendez-vous en visio à ${heure}`, html };
}
