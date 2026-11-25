/* Logique de réservation d'un créneau d'appel du site :
   - POST /api/call-bookings (tunnel public, requireEmptySlot: true — anti-race sur une fiche fraîche)
   - /api/rendez-vous/[token] (le client change lui-même son créneau).
   L'ancien admin du site (requireEmptySlot: false) a été supprimé au nettoyage du 21/11 : l'admin
   programme désormais les appels depuis la plateforme (app.myracoustic.com), qui a son propre moteur.

   Trois "kind" possibles selon d'où vient la fiche à rappeler — un seul moteur de réservation,
   pas une copie par tunnel (leçon du bug de calendrier du 06/08 : un copier-coller de la logique
   de blocage de journée avait déjà causé un vrai bug de production, voir site/CLAUDE.md).

   Depuis le 25/11, le premier rendez-vous d'une demande mariage se fait en visio : l'événement
   d'agenda est créé avec sa salle Google Meet, gardée dans mariage_leads.call_meet_url (règles et
   e-mail dans app/lib/rendez-vous-visio.js, fichier commun à la plateforme). Si Google ne crée pas
   la salle, tout se passe comme avant (événement « Appel », e-mail de l'appel téléphonique). Les
   rappels (veille, une heure avant) et l'annulation sont gérés par la plateforme. */
import crypto from 'crypto';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getCalendarClient, getCalendarId } from '@/lib/google-calendar';
import { apiSdk } from '@/app/lib/api-externe';
import { addMinutesToTime, parisLocalToUtcISO, parisDatePlusDays, utcToParisParts } from '@/lib/paris-time';
import { getAvailableSlots, getSlotDurationMinutes } from '@/lib/call-slots';
import { sendCallConfirmEmail, sendCallCancelEmail, sendBookingLinkEmail, sendCallReminderEmail, sendVisioConfirmEmail, fmtSlotDateTime } from '@/app/lib/send-call-confirm-email';
import { avecVisio, demandeVisio, lienVisio, lienRejoindre, lienIcs, lienGoogleAgenda, rappelHeureInutile } from '@/app/lib/rendez-vous-visio';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
// Adresse de la plateforme pour les liens de visio. Réglée seulement en local (essais sur cet
// ordinateur) ; en ligne elle est absente et les liens mènent à app.myracoustic.com.
const PLATEFORME_URL_LOCALE = process.env.NEXT_PUBLIC_PLATEFORME_URL || undefined;

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

const SOURCES = {
  mariage: {
    table: 'mariage_leads',
    select: 'id, prenom, nom, tel, email, event_date, lieu, guests, message',
    summary: (r) => `📞 Appel — ${r.prenom} ${r.nom} (mariage)`,
    summaryVisio: (r) => `🎥 Visio — ${r.prenom} ${r.nom} (mariage)`,
    description: (r) => [
      `Tél : ${r.tel}`,
      `Email : ${r.email}`,
      r.event_date ? `Date de mariage envisagée : ${fmtDate(r.event_date)}` : null,
      r.lieu ? `Lieu : ${r.lieu}` : null,
      r.guests ? `Invités : ${r.guests}` : null,
      r.message ? `Message : ${r.message}` : null,
    ],
    extendedKey: 'mariage_lead_id',
    firstName: (r) => r.prenom,
    tel: (r) => r.tel,
    email: (r) => r.email,
    topic: 'de votre mariage',
    cancelSelect: 'call_google_event_id, prenom, email, call_scheduled_at',
  },
  devis: {
    table: 'qonto_quotes_tracking',
    select: 'id, client_first_name, client_last_name, client_phone, client_email, event_type, event_date, venue',
    summary: (r) => `📞 Appel — ${r.client_first_name} ${r.client_last_name} (devis)`,
    description: (r) => [
      `Tél : ${r.client_phone}`,
      `Email : ${r.client_email}`,
      r.event_type ? `Type d'événement : ${r.event_type}` : null,
      r.event_date ? `Date envisagée : ${fmtDate(r.event_date)}` : null,
      r.venue ? `Lieu : ${r.venue}` : null,
    ],
    extendedKey: 'qonto_quote_tracking_id',
    firstName: (r) => r.client_first_name,
    tel: (r) => r.client_phone,
    email: (r) => r.client_email,
    topic: 'de votre devis',
    cancelSelect: 'call_google_event_id, client_first_name, client_email, call_scheduled_at',
  },
  pro_contact: {
    table: 'pro_contact_leads',
    select: 'id, prenom, nom, societe, structure, email, tel, event_type, personnes, event_date, budget, lieu, description',
    // Un particulier n'a pas de société (structure « particulier », 17/11) : sans ce repli, l'agenda affichait « (null) ».
    summary: (r) => `📞 Appel — ${r.prenom} ${r.nom} (${r.societe || (r.structure === 'particulier' ? 'particulier' : 'pro')})`,
    description: (r) => [
      `Tél : ${r.tel}`,
      `Email : ${r.email}`,
      r.societe ? `Société : ${r.societe}` : null,
      r.event_type ? `Type d'événement : ${r.event_type}` : null,
      r.personnes ? `Effectif : ${r.personnes}` : null,
      r.event_date ? `Date souhaitée : ${r.event_date}` : null,
      r.lieu ? `Lieu : ${r.lieu}` : null,
    ],
    extendedKey: 'pro_contact_lead_id',
    firstName: (r) => r.prenom,
    tel: (r) => r.tel,
    email: (r) => r.email,
    topic: 'de votre projet',
    cancelSelect: 'call_google_event_id, prenom, email, call_scheduled_at',
  },
  // Rendez-vous d'accompagnement une fois le prospect devenu client (présentation de la
  // plateforme, visite du lieu à 6 mois, point à 1 mois, derniers réglages à 2 semaines) —
  // une ligne par étape par événement, voir supabase-migrations/2026-09-14_event_milestones.sql.
  event_milestone: {
    table: 'event_milestones',
    select: 'id, milestone_type, target_date, events(event_date, venue, clients(first_name, last_name, email, phone))',
    summary: (r) => `📞 ${MILESTONE_LABELS[r.milestone_type] || 'Rendez-vous'} — ${r.events?.clients?.first_name} ${r.events?.clients?.last_name}`,
    description: (r) => [
      `Tél : ${r.events?.clients?.phone}`,
      `Email : ${r.events?.clients?.email}`,
      r.events?.event_date ? `Date du mariage : ${fmtDate(r.events.event_date)}` : null,
      r.events?.venue ? `Lieu : ${r.events.venue}` : null,
    ],
    extendedKey: 'event_milestone_id',
    firstName: (r) => r.events?.clients?.first_name,
    tel: (r) => r.events?.clients?.phone,
    email: (r) => r.events?.clients?.email,
    topic: 'de la suite de votre accompagnement Myracoustic',
    cancelSelect: 'call_google_event_id, milestone_type, call_scheduled_at, events(clients(first_name, email))',
  },
};

export const MILESTONE_LABELS = {
  presentation: 'Présentation de la plateforme',
  visite_lieu: 'Visite du lieu',
  point_1_mois: 'Point à 1 mois',
  reglages_2_semaines: 'Derniers réglages',
};

/* Jeton public de la fiche (lien "choisir/modifier mon créneau", envoyé par email — jamais
   l'id brut de la fiche dans une URL publique). Généré à la demande et persisté au premier
   besoin, pas de backfill : la grande majorité des fiches n'auront jamais ce lien envoyé. */
export async function ensureCallToken({ kind = 'mariage', refId }) {
  const src = SOURCES[kind];
  if (!src) return null;

  const { data: row } = await supabaseAdmin.from(src.table).select('call_token').eq('id', refId).maybeSingle();
  if (row?.call_token) return row.call_token;

  const token = crypto.randomBytes(20).toString('hex');
  const { error } = await supabaseAdmin.from(src.table).update({ call_token: token }).eq('id', refId);
  if (error) { console.error('ensureCallToken error:', error.message); return null; }
  return token;
}

/* Retrouve à quelle fiche (kind + id) correspond un jeton public — cherche dans les 3 tables,
   un jeton donné n'appartient qu'à une seule d'entre elles (contrainte unique par table, et
   l'espace aléatoire de crypto.randomBytes(20) rend une collision inter-tables non plausible). */
export async function resolveCallToken(token) {
  if (!token) return null;
  for (const [kind, src] of Object.entries(SOURCES)) {
    const { data: row } = await supabaseAdmin.from(src.table).select(src.select + ', call_scheduled_at, call_cancelled_at, call_google_event_id' + (avecVisio(kind) ? ', call_meet_url' : '')).eq('call_token', token).maybeSingle();
    if (row) return { kind, refId: row.id, row, visio: avecVisio(kind) };
  }
  return null;
}

/* Envoie au prospect un email avec son lien personnel de prise de créneau — pour les cas où
   on préfère le laisser choisir plutôt que fixer un horaire soi-même ou l'appeler à l'aveugle. */
export async function sendBookingLinkForLead({ kind = 'mariage', refId }) {
  const src = SOURCES[kind];
  if (!src) return { error: 'invalid_kind', status: 400 };

  const { data: row } = await supabaseAdmin.from(src.table).select(src.select).eq('id', refId).maybeSingle();
  if (!row) return { error: 'not_found', status: 404 };

  const token = await ensureCallToken({ kind, refId });
  if (!token) return { error: 'token_generation_failed', status: 500 };

  try {
    await sendBookingLinkEmail({
      toEmail: src.email(row),
      firstName: src.firstName(row),
      topic: src.topic,
      bookingUrl: `${APP_URL}/rendez-vous/${token}`,
    });
  } catch (err) {
    return { error: err.message, status: 500 };
  }
  return { ok: true };
}

// Supprime l'événement Google d'un appel (best-effort, tolère déjà supprimé) — utilisé
// à l'annulation ET juste avant une reprogrammation (l'ancien créneau ne doit plus apparaître).
export async function deleteCallGoogleEvent(googleEventId) {
  if (!googleEventId) return;
  try {
    const calendar = getCalendarClient();
    // 404 / 410 = déjà supprimé de l'agenda : rien à signaler.
    await apiSdk('google-agenda', 'calendar.events.delete', () => calendar.events.delete({ calendarId: getCalendarId(), eventId: googleEventId }),
      { methode: 'DELETE', statutsNormaux: [404, 410] });
  } catch (err) {
    console.error('Calendar delete error:', err.message);
  }
}

// Google a-t-il refusé la demande pour de bon (rien n'a été créé) ? Un délai dépassé ou une erreur
// floue ne le garantit pas : dans ce cas on ne retente rien, pour ne pas créer un doublon.
function refusCertain(err) {
  const status = Number(err?.status ?? err?.response?.status ?? err?.code);
  return Number.isInteger(status) && ((status >= 400 && status < 500) || status === 503);
}

/* Crée l'événement d'agenda du rendez-vous. En visio, il est créé avec sa salle Google Meet ; si
   Google refuse la salle, on retombe sur l'événement « Appel » habituel (meetUrl reste null).
   Même logique que plateforme/lib/call-booking.js. */
async function creerEvenementAgenda({ src, kind, refId, row, date, time, slotMinutes }) {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const endTime = addMinutesToTime(time, slotMinutes);
  const corps = (summary) => ({
    summary,
    description: src.description(row).filter(Boolean).join('\n'),
    start: { dateTime: `${date}T${time}:00`, timeZone: 'Europe/Paris' },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: 'Europe/Paris' },
    status: 'confirmed',
    transparency: 'opaque',
    extendedProperties: { private: { [src.extendedKey]: refId, kind: 'call_appointment' } },
  });
  const inserer = (requete) => apiSdk('google-agenda', 'calendar.events.insert',
    () => calendar.events.insert({ calendarId, ...requete }), { methode: 'POST' });

  if (avecVisio(kind)) {
    try {
      const res = await inserer({ conferenceDataVersion: 1, requestBody: { ...corps(src.summaryVisio(row)), ...demandeVisio(crypto.randomUUID()) } });
      let meetUrl = lienVisio(res.data);
      if (!meetUrl) {
        // Salle encore « en attente » : une seconde lecture. Toujours rien : le titre redevient
        // « Appel », pour que l'agenda dise la même chose que l'e-mail reçu par les mariés.
        try {
          await new Promise((r) => setTimeout(r, 1500));
          const relu = await apiSdk('google-agenda', 'calendar.events.get', () => calendar.events.get({ calendarId, eventId: res.data.id }), { methode: 'GET' });
          meetUrl = lienVisio(relu.data);
          if (!meetUrl) {
            await apiSdk('google-agenda', 'calendar.events.patch', () => calendar.events.patch({ calendarId, eventId: res.data.id, requestBody: { summary: src.summary(row) } }), { methode: 'PATCH' });
          }
        } catch (err) {
          console.error('visio : relecture de la salle impossible :', err.message);
        }
      }
      return { eventId: res.data.id, meetUrl };
    } catch (err) {
      if (!refusCertain(err)) throw err;
      console.error('visio non créée, événement sans salle :', err.message);
    }
  }
  const res = await inserer({ requestBody: corps(src.summary(row)) });
  return { eventId: res.data.id, meetUrl: null };
}

/* Réserve/programme le créneau (date, time) pour la fiche `refId` du type `kind`.
   requireEmptySlot=true : n'écrase que si call_scheduled_at est encore vide (protection
   anti-race publique — deux onglets ne peuvent pas confirmer la même fiche deux fois).
   requireEmptySlot=false : écrase sans condition (admin, programmation ou modification
   d'une fiche déjà connue) — la collision inter-fiches reste bloquée par l'index unique.
   windowDays : fenêtre de réservation (7 j public, ADMIN_BOOKING_WINDOW_DAYS admin).
   isReschedule : adapte le texte de l'email de confirmation (« modifié » plutôt que
   « confirmé ») quand ça remplace un rendez-vous déjà existant. */
export async function bookCallSlot({ kind = 'mariage', refId, date, time, requireEmptySlot, windowDays, isReschedule = false }) {
  const src = SOURCES[kind];
  if (!src) return { error: 'invalid_kind', status: 400 };

  const slots = await getAvailableSlots(date, windowDays);
  if (!slots.includes(time)) return { error: 'slot_taken', status: 409 };

  const isoStart = parisLocalToUtcISO(date, time);
  const slotMinutes = await getSlotDurationMinutes();
  const visio = avecVisio(kind);

  let query = supabaseAdmin
    .from(src.table)
    .update({
      call_scheduled_at: isoStart, call_duration_minutes: slotMinutes, call_cancelled_at: null, call_google_event_id: null,
      // Visio : nouveau créneau = nouvelle salle et rappels à refaire (le rappel « une heure avant »
      // est noté d'office quand le rendez-vous est tout proche : la confirmation suffit).
      ...(visio ? {
        call_meet_url: null, call_reminder_sent_at: null,
        call_hour_reminder_sent_at: rappelHeureInutile(isoStart) ? new Date().toISOString() : null,
      } : {}),
    })
    .eq('id', refId);
  if (requireEmptySlot) query = query.is('call_scheduled_at', null);

  const { data: updated, error: updateErr } = await query.select(src.select).maybeSingle();

  if (updateErr) {
    if (updateErr.code === '23505') return { error: 'slot_taken', status: 409 };
    return { error: updateErr.message, status: 500 };
  }
  if (!updated) return { error: 'lead_already_booked', status: 409 };

  // Événement Google Calendar : best-effort. Si ça échoue, la réservation en base
  // reste valide — un admin peut recréer l'événement à la main si besoin.
  let meetUrl = null;
  try {
    const cree = await creerEvenementAgenda({ src, kind, refId, row: updated, date, time, slotMinutes });
    meetUrl = cree.meetUrl;
    await supabaseAdmin
      .from(src.table)
      .update({ call_google_event_id: cree.eventId, ...(visio ? { call_meet_url: meetUrl } : {}) })
      .eq('id', refId);
  } catch (err) {
    console.error('call booking calendar event error:', err.message);
  }

  // Email de confirmation du créneau : best-effort, comme l'événement Google ci-dessus.
  // Inclut toujours un lien pour que le client modifie lui-même le créneau si besoin.
  // En visio (salle créée) : bouton « Rejoindre la visio », qui passe par la plateforme.
  try {
    const token = await ensureCallToken({ kind, refId });
    const commun = {
      toEmail: src.email(updated), firstName: src.firstName(updated), tel: src.tel(updated),
      slotLabel: fmtSlotDateTime(date, time), isReschedule, modifyUrl: token ? `${APP_URL}/rendez-vous/${token}` : null,
    };
    if (meetUrl && token) {
      const rejoindreUrl = lienRejoindre(token, PLATEFORME_URL_LOCALE);
      await sendVisioConfirmEmail({
        ...commun, rejoindreUrl,
        googleUrl: lienGoogleAgenda({ date, time, dureeMinutes: slotMinutes, rejoindreUrl }),
        icsUrl: lienIcs(token, PLATEFORME_URL_LOCALE),
      });
    } else {
      await sendCallConfirmEmail({ ...commun, topic: src.topic });
    }
  } catch (err) {
    console.error('call booking confirm email error:', err.message);
  }

  return { ok: true, date, time, visio: !!meetUrl };
}

/* Rappel automatique J-1 pour tous les appels programmés le lendemain (heure de Paris),
   tous tunnels confondus (mariage, devis, pro_contact) — un seul passage, comme le reste
   du planning d'appel. Un appel n'est jamais rappelé deux fois (call_reminder_sent_at). */
export async function runCallReminders() {
  const tomorrow    = parisDatePlusDays(1);
  const dayAfter     = parisDatePlusDays(2);
  const startIso     = parisLocalToUtcISO(tomorrow, '00:00');
  const endIso       = parisLocalToUtcISO(dayAfter, '00:00');

  const results = [];
  for (const [kind, src] of Object.entries(SOURCES)) {
    const { data: rows, error } = await supabaseAdmin
      .from(src.table)
      .select(`${src.select}, call_scheduled_at`)
      .gte('call_scheduled_at', startIso)
      .lt('call_scheduled_at', endIso)
      .is('call_cancelled_at', null)
      .is('call_reminder_sent_at', null);

    if (error) { results.push({ kind, status: 'error', error: error.message }); continue; }

    for (const row of rows || []) {
      const email = src.email(row);
      if (!email) continue;
      const { date, time } = utcToParisParts(row.call_scheduled_at);
      try {
        await sendCallReminderEmail({
          toEmail: email,
          firstName: src.firstName(row),
          tel: src.tel(row),
          slotLabel: fmtSlotDateTime(date, time),
          topic: src.topic,
        });
        await supabaseAdmin.from(src.table).update({ call_reminder_sent_at: new Date().toISOString() }).eq('id', row.id);
        results.push({ kind, id: row.id, status: 'sent' });
      } catch (err) {
        results.push({ kind, id: row.id, status: 'error', error: err.message });
      }
    }
  }
  return { sent: results.filter(r => r.status === 'sent').length, results };
}

/* Annule l'appel programmé sur la fiche `refId` du type `kind` : supprime l'événement Google
   (best-effort) puis pose call_cancelled_at. Best-effort aussi sur l'email d'annulation —
   l'annulation reste actée en base quoi qu'il arrive. */
export async function cancelCallSlot({ kind = 'mariage', refId }) {
  const src = SOURCES[kind];
  if (!src) return { error: 'invalid_kind', status: 400 };

  const { data: row } = await supabaseAdmin
    .from(src.table).select(src.cancelSelect).eq('id', refId).maybeSingle();
  await deleteCallGoogleEvent(row?.call_google_event_id);

  const { error } = await supabaseAdmin
    .from(src.table)
    .update({ call_cancelled_at: new Date().toISOString() })
    .eq('id', refId);
  if (error) return { error: error.message, status: 500 };

  if (row?.call_scheduled_at) {
    try {
      await sendCallCancelEmail({ toEmail: src.email(row), firstName: src.firstName(row) });
    } catch (err) {
      console.error('call cancel email error:', err.message);
    }
  }
  return { ok: true };
}
