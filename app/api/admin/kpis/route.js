import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getPeriodRanges, deltaPct, DATA_START_DATE } from '@/app/lib/period-ranges';

/* Dashboard KPI — agrégation en JS sur un seul chargement par table (pas de SQL agrégé caché :
   si un chiffre semble faux un jour, on relit ce fichier et on suit le calcul à la main).

   Définitions (une phrase par verticale, cf. plan validé le 19/08) :
   - Prospect mariage = ligne mariage_leads. Particulier/pro = email distinct entre
     devis_particulier_progress et qonto_quotes_tracking (filtré par client_kind), dédupliqué.
     lead_magnet_signups et brouillons jamais envoyés exclus (trop froids).
   - Devis envoyé = devis_proposals (mariage, toute proposition créée = envoyée par l'admin) +
     qonto_quotes_tracking où kind='auto_envoye' (particulier/pro — un brouillon jamais envoyé
     ne compte pas), sur created_at.
   - Client converti = qonto_signed_quotes (même source que le CA signé), sur approved_at, filtré
     par vertical — pas events.confirmed_at, qui ne couvre que les clients ayant une fiche dans
     notre base (certains clients réels, signés directement dans Qonto, n'en ont pas).
   - CA signé = qonto_signed_quotes (source de vérité = Qonto directement, tout devis avec
     `approved_at` réellement rempli — PAS juste status='approved', qui peut inclure des devis
     jamais confirmés par le client, découverte du 19/08/2026). Couvre aussi bien les devis créés
     via le site que ceux créés à la main dans Qonto (la majorité en réalité) — contrairement à
     devis_proposals/qonto_quotes_tracking qui ne voient que ce qui passe par le site. Synchronisé
     par lib/qonto-sync.js (cron 15 min, table qonto_signed_quotes).
   - CA encaissé = somme qonto_payments.amount sur paid_at, jamais confondu avec le CA signé.
   - Devis en attente / perdu = parmi les devis envoyés non convertis, ceux encore dans leur
     délai de validité (valid_until/expiry_date) vs ceux expirés sans signature — jamais de
     statut "expiré" stocké en base, toujours recalculé (voir classifyProposal/classifyQuote). */

function inRange(dateStr, range) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d < range.end;
}

function emptyBucket() {
  return { ca_signe: 0, ca_encaisse: 0, clients_confirmes: 0, prospects_entrants: 0, devis_envoyes: 0, devis_en_attente: 0, devis_perdus: 0, sources: {} };
}

// Classe un devis mariage (status + valid_until) en 'converti' / 'en_attente' / 'perdu'.
// Jamais de statut "expiré" stocké en base — recalculé à la volée, comme lib/run-devis-reminders.js.
function classifyProposal(p, today) {
  if (p.status === 'validee') return 'converti';
  if (p.status === 'refusee') return 'perdu';
  // status === 'proposee'
  if (p.valid_until && new Date(p.valid_until) < today) return 'perdu';
  return 'en_attente';
}

// Idem pour un devis particulier/pro (qonto_status + expiry_date). kind='brouillon' est filtré
// en amont, avant l'appel (jamais envoyé au client, hors périmètre de ce calcul).
function classifyQuote(q, today) {
  if (q.qonto_status === 'approved') return 'converti';
  if (q.qonto_status === 'canceled') return 'perdu';
  // qonto_status === 'pending_approval'
  if (q.expiry_date && new Date(q.expiry_date) < today) return 'perdu';
  return 'en_attente';
}

export async function GET(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';
  if (!['week', 'month', 'year'].includes(period)) {
    return Response.json({ error: 'period invalide' }, { status: 400 });
  }

  const ranges = getPeriodRanges(period);
  const windowEndISO = ranges.current.end.toISOString();
  // Bornes des tables de prospects (mariage_leads, devis_particulier_progress,
  // qonto_quotes_tracking, pro_contact_leads) : ces tables n'existent que depuis
  // DATA_START_DATE, aucune ligne ne peut exister avant — floor légitime.
  // events / qonto_payments / devis_proposals : PAS de floor ici. Ces tables ont été
  // rétro-remplies avec de vraies dates Qonto antérieures à la création des tables
  // (ex. paiements réels d'avril 2026) — un floor sur created_at exclurait à tort du
  // vrai CA passé. Seule la borne haute (fin de la période courante) s'applique.
  const prospectWindowStartISO = DATA_START_DATE.toISOString();

  const [
    { data: events },
    { data: payments },
    { data: signedQuotes },
    { data: allProposals },
    { data: mariageLeads },
    { data: progress },
    { data: quotesTracking },
    { data: allQuotes },
    { data: proContacts },
  ] = await Promise.all([
    // Pas de filtre de date ici : petite table, et confirmed_at est nullable (un .lt() SQL
    // exclurait silencieusement les événements pas encore confirmés dont on a quand même besoin
    // pour résoudre la verticale des paiements qui leur sont liés).
    supabaseAdmin.from('events').select('id, vertical, confirmed_at'),
    supabaseAdmin.from('qonto_payments').select('amount, paid_at, event_id, vertical').lt('paid_at', windowEndISO.slice(0, 10)),
    // Source de vérité du CA signé — table synchronisée depuis Qonto directement (voir
    // lib/qonto-sync.js). Petite table, pas de filtre de date nécessaire au chargement.
    supabaseAdmin.from('qonto_signed_quotes').select('amount, vertical, approved_at'),
    // Version non filtrée (tous statuts) pour compter "devis envoyés" + suivi de cohorte —
    // petite table, pas de souci de volume à charger en entier.
    supabaseAdmin.from('devis_proposals').select('id, created_at, status, valid_until, lead_id'),
    supabaseAdmin.from('mariage_leads').select('id, created_at, source').gte('created_at', prospectWindowStartISO).lt('created_at', windowEndISO),
    supabaseAdmin.from('devis_particulier_progress').select('email, created_at').gte('created_at', prospectWindowStartISO).lt('created_at', windowEndISO),
    supabaseAdmin.from('qonto_quotes_tracking').select('client_email, client_kind, qonto_status, total_ttc, created_at, event_type').neq('qonto_status', 'canceled').gte('created_at', prospectWindowStartISO).lt('created_at', windowEndISO),
    // Version non filtrée (tous statuts, y compris annulés/brouillons) pour "devis envoyés" +
    // suivi de cohorte — un devis annulé compte comme envoyé mais pas comme converti.
    supabaseAdmin.from('qonto_quotes_tracking').select('id, created_at, kind, qonto_status, client_kind, event_type, expiry_date, source'),
    supabaseAdmin.from('pro_contact_leads').select('email, created_at').gte('created_at', prospectWindowStartISO).lt('created_at', windowEndISO),
  ]);

  // events.vertical n'est connu qu'après création de l'événement — pour le CA encaissé on a
  // besoin de le retrouver via event_id.
  const eventVerticalById = new Map((events || []).map(e => [e.id, e.vertical]));
  // Origine du lead mariage à l'entrée (mariage_leads.source) — pour rattacher un devis validé
  // (devis_proposals) à sa source via lead_id.
  const leadSourceById = new Map((mariageLeads || []).map(l => [l.id, l.source || 'inconnu']));
  const today = new Date();

  function bumpSource(bucket, key, field) {
    if (!bucket.sources[key]) bucket.sources[key] = { entrants: 0, convertis: 0 };
    bucket.sources[key][field]++;
  }

  function bucketFor(range) {
    const b = { global: emptyBucket(), mariage: emptyBucket(), particulier: emptyBucket(), professionnel: emptyBucket() };

    // Clients confirmés — même source que le CA signé (qonto_signed_quotes), pas events.
    // events ne couvre que les clients qui ont une fiche dans notre base ; des clients réels
    // signés directement dans Qonto (ex. Commune de Carolles, SCI Buffon) n'en ont pas et
    // seraient sinon invisibles ici alors qu'ils comptent bien dans le CA signé — demande de
    // Myrio le 19/08 pour que les deux chiffres restent cohérents entre eux.
    for (const q of signedQuotes || []) {
      if (!inRange(q.approved_at, range)) continue;
      b.global.clients_confirmes++;
      if (q.vertical) b[q.vertical].clients_confirmes++;
    }

    // CA encaissé
    for (const p of payments || []) {
      if (!inRange(p.paid_at, range)) continue;
      const vertical = p.vertical || eventVerticalById.get(p.event_id);
      const amount = Number(p.amount) || 0;
      b.global.ca_encaisse += amount;
      if (vertical) b[vertical].ca_encaisse += amount;
    }

    // CA signé — source unique Qonto (qonto_signed_quotes), sur approved_at réel
    for (const q of signedQuotes || []) {
      if (!inRange(q.approved_at, range)) continue;
      const montant = Number(q.amount) || 0;
      b.global.ca_signe += montant; // toujours compté au global, même si verticale indéterminée
      if (q.vertical) b[q.vertical].ca_signe += montant;
    }

    // Devis envoyés — mariage (toute proposition créée = envoyée par l'admin), + répartition
    // converti/en attente/perdu (voir classifyProposal — jamais un statut "expiré" stocké,
    // toujours recalculé au moment de l'affichage).
    for (const p of allProposals || []) {
      if (!inRange(p.created_at, range)) continue;
      b.mariage.devis_envoyes++;
      b.global.devis_envoyes++;
      const c = classifyProposal(p, today);
      if (c === 'en_attente') { b.mariage.devis_en_attente++; b.global.devis_en_attente++; }
      else if (c === 'perdu') { b.mariage.devis_perdus++; b.global.devis_perdus++; }
    }
    // Devis envoyés — particulier/pro (kind='auto_envoye' seulement, un brouillon n'a rien reçu)
    for (const q of allQuotes || []) {
      if (q.event_type === 'Mariage' || q.kind !== 'auto_envoye' || !inRange(q.created_at, range)) continue;
      const vertical = q.client_kind === 'company' ? 'professionnel' : 'particulier';
      b[vertical].devis_envoyes++;
      b.global.devis_envoyes++;
      const c = classifyQuote(q, today);
      if (c === 'en_attente') { b[vertical].devis_en_attente++; b.global.devis_en_attente++; }
      else if (c === 'perdu') { b[vertical].devis_perdus++; b.global.devis_perdus++; }
    }

    // Prospects entrants — mariage
    for (const l of mariageLeads || []) {
      if (!inRange(l.created_at, range)) continue;
      b.mariage.prospects_entrants++;
      b.global.prospects_entrants++;
    }

    // Prospects entrants — particulier/pro, dédupliqués par email
    const seenParticulier = new Set();
    const seenPro = new Set();
    for (const row of progress || []) {
      if (!inRange(row.created_at, range) || !row.email) continue;
      const email = row.email.toLowerCase();
      if (!seenParticulier.has(email)) { seenParticulier.add(email); b.particulier.prospects_entrants++; b.global.prospects_entrants++; }
    }
    for (const q of quotesTracking || []) {
      if (q.event_type === 'Mariage' || !inRange(q.created_at, range) || !q.client_email) continue;
      const email = q.client_email.toLowerCase();
      const isCompany = q.client_kind === 'company';
      const set = isCompany ? seenPro : seenParticulier;
      const vertical = isCompany ? 'professionnel' : 'particulier';
      if (!set.has(email)) { set.add(email); b[vertical].prospects_entrants++; b.global.prospects_entrants++; }
    }
    for (const row of proContacts || []) {
      if (!inRange(row.created_at, range) || !row.email) continue;
      const email = row.email.toLowerCase();
      if (!seenPro.has(email)) { seenPro.add(email); b.professionnel.prospects_entrants++; b.global.prospects_entrants++; }
    }

    // Origine des prospects (gclid auto / menu déclaratif — voir migration du 25/08). 'inconnu'
    // regroupe tout ce qui n'a ni clic pub ni réponse déclarée (direct, organique, oubli du
    // formulaire) — jamais réparti au prorata, toujours affiché tel quel.
    // Mariage : entrants = mariage_leads, convertis = devis_proposals validés rattachés via lead_id.
    for (const l of mariageLeads || []) {
      if (!inRange(l.created_at, range)) continue;
      const key = l.source || 'inconnu';
      bumpSource(b.mariage, key, 'entrants');
      bumpSource(b.global, key, 'entrants');
    }
    for (const p of allProposals || []) {
      if (p.status !== 'validee' || !inRange(p.created_at, range)) continue;
      const key = leadSourceById.get(p.lead_id) || 'inconnu';
      bumpSource(b.mariage, key, 'convertis');
      bumpSource(b.global, key, 'convertis');
    }
    // Particulier/pro : qonto_quotes_tracking.source (propagé à la création du devis depuis
    // devis_particulier_progress) donne directement entrants (kind='auto_envoye') et convertis.
    for (const q of allQuotes || []) {
      if (q.event_type === 'Mariage' || q.kind !== 'auto_envoye' || !inRange(q.created_at, range)) continue;
      const vertical = q.client_kind === 'company' ? 'professionnel' : 'particulier';
      const key = q.source || 'inconnu';
      bumpSource(b[vertical], key, 'entrants');
      bumpSource(b.global, key, 'entrants');
      if (q.qonto_status === 'approved') {
        bumpSource(b[vertical], key, 'convertis');
        bumpSource(b.global, key, 'convertis');
      }
    }

    return b;
  }

  const current = bucketFor(ranges.current);
  const previous = bucketFor(ranges.previous);
  const previousYear = ranges.previousYear.available === false ? null : bucketFor(ranges.previousYear);

  function withDeltas(vertical) {
    const c = current[vertical];
    const p = previous[vertical];
    const py = previousYear ? previousYear[vertical] : null;
    const tauxConversion = c.prospects_entrants > 0 ? Math.round((c.clients_confirmes / c.prospects_entrants) * 1000) / 10 : null;
    const tauxPrev = p.prospects_entrants > 0 ? Math.round((p.clients_confirmes / p.prospects_entrants) * 1000) / 10 : null;
    return {
      ca_signe: { value: Math.round(c.ca_signe), deltaPrevPct: deltaPct(c.ca_signe, p.ca_signe), deltaYearPct: py ? deltaPct(c.ca_signe, py.ca_signe) : null },
      ca_encaisse: { value: Math.round(c.ca_encaisse), deltaPrevPct: deltaPct(c.ca_encaisse, p.ca_encaisse), deltaYearPct: py ? deltaPct(c.ca_encaisse, py.ca_encaisse) : null },
      devis_envoyes: { value: c.devis_envoyes, deltaPrevPct: deltaPct(c.devis_envoyes, p.devis_envoyes), deltaYearPct: py ? deltaPct(c.devis_envoyes, py.devis_envoyes) : null },
      devis_en_attente: { value: c.devis_en_attente },
      devis_perdus: { value: c.devis_perdus },
      taux_perte: { value: c.devis_envoyes > 0 ? Math.round((c.devis_perdus / c.devis_envoyes) * 1000) / 10 : null, caveat: 'Devis expirés sans signature / devis envoyés sur la période — les devis encore en attente ne comptent pas comme perdus.' },
      clients_confirmes: { value: c.clients_confirmes, deltaPrevPct: deltaPct(c.clients_confirmes, p.clients_confirmes), deltaYearPct: py ? deltaPct(c.clients_confirmes, py.clients_confirmes) : null },
      prospects_entrants: { value: c.prospects_entrants, deltaPrevPct: deltaPct(c.prospects_entrants, p.prospects_entrants), deltaYearPct: py ? deltaPct(c.prospects_entrants, py.prospects_entrants) : null },
      taux_conversion: { value: tauxConversion, deltaPrevPct: (tauxConversion !== null && tauxPrev !== null) ? deltaPct(tauxConversion, tauxPrev) : null, caveat: 'Taux de flux sur la période — pas un suivi de cohorte individuelle.' },
      // Pas de delta ici : la collecte de l'origine vient de démarrer (25/08), aucune période
      // antérieure n'a de donnée comparable.
      sources: c.sources,
    };
  }

  // ── Tableau mensuel (6 derniers mois) : suivi de cohorte réel — pour les devis envoyés dans
  // un mois M, quelle proportion a ÉTÉ (ou sera un jour) convertie, peu importe quand la
  // conversion a eu lieu. Plus précis que "taux_conversion" ci-dessus (qui compare deux
  // compteurs de la même période, pas un vrai suivi individuel).
  const monthKeys = [];
  { const now = new Date(); // toujours ancré sur le mois réel, indépendamment de l'onglet période sélectionné
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    for (let i = 5; i >= 0; i--) {
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
      monthKeys.push(m.toISOString().slice(0, 7));
    } }

  function monthKeyOf(dateStr) { return dateStr ? dateStr.slice(0, 7) : null; }

  const monthlyTrend = monthKeys.map(key => {
    const row = { month: key, label: new Date(key + '-01T00:00:00Z').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }) };
    for (const v of ['mariage', 'particulier', 'professionnel']) {
      let envoyes = 0, convertis = 0;
      if (v === 'mariage') {
        for (const p of allProposals || []) {
          if (monthKeyOf(p.created_at) !== key) continue;
          envoyes++;
          if (p.status === 'validee') convertis++;
        }
      } else {
        for (const q of allQuotes || []) {
          if (q.event_type === 'Mariage' || q.kind !== 'auto_envoye' || monthKeyOf(q.created_at) !== key) continue;
          const qv = q.client_kind === 'company' ? 'professionnel' : 'particulier';
          if (qv !== v) continue;
          envoyes++;
          if (q.qonto_status === 'approved') convertis++;
        }
      }
      row[v] = { envoyes, convertis, taux: envoyes > 0 ? Math.round((convertis / envoyes) * 1000) / 10 : null };
    }
    return row;
  });

  // ── Prévisionnel : vue "pipeline total", volontairement PAS filtrée par période (semaine/
  // mois/année n'a pas de sens ici — c'est l'ensemble des contrats actifs, peu importe quand ils
  // ont été signés). Total signé = tout ce qui a été validé/accepté à ce jour (jamais annulé/
  // refusé). Reste à encaisser = signé moins déjà encaissé — peut légèrement diverger de la
  // réalité si un client a payé plus que son devis d'origine (rare) ou si un remboursement a eu
  // lieu (non géré aujourd'hui), sinon c'est une vraie soustraction de deux totaux réels.
  const previsionnel = { global: { signe: 0, encaisse: 0 }, mariage: { signe: 0, encaisse: 0 }, particulier: { signe: 0, encaisse: 0 }, professionnel: { signe: 0, encaisse: 0 } };
  for (const q of signedQuotes || []) {
    const montant = Number(q.amount) || 0;
    previsionnel.global.signe += montant;
    if (q.vertical) previsionnel[q.vertical].signe += montant;
  }
  for (const p of payments || []) {
    const vertical = p.vertical || eventVerticalById.get(p.event_id);
    const amount = Number(p.amount) || 0;
    previsionnel.global.encaisse += amount;
    if (vertical) previsionnel[vertical].encaisse += amount;
  }
  for (const v of Object.keys(previsionnel)) {
    const signe = Math.round(previsionnel[v].signe);
    const encaisse = Math.round(previsionnel[v].encaisse);
    // Peut arriver que l'encaissé dépasse le signé connu : pas un vrai dépassement, mais des
    // contrats antérieurs au système de suivi (avant le 05/08) dont le montant "signé" n'a jamais
    // été enregistré — leur encaissement, lui, est bien réel et compté. Jamais affiché en négatif,
    // ce serait trompeur ; le vrai signé/encaissé restent visibles pour comprendre l'écart.
    const resteAEncaisser = Math.max(0, signe - encaisse);
    previsionnel[v] = { signe, encaisse, resteAEncaisser, incomplet: encaisse > signe };
  }

  return Response.json({
    period,
    range: { start: ranges.current.start.toISOString().slice(0, 10), end: new Date(ranges.current.end.getTime() - 86400000).toISOString().slice(0, 10), label: ranges.current.label },
    previousYearAvailable: !!previousYear,
    kpis: {
      global: withDeltas('global'),
      mariage: withDeltas('mariage'),
      particulier: withDeltas('particulier'),
      professionnel: withDeltas('professionnel'),
    },
    monthlyTrend,
    previsionnel,
    caSigneVerticaleIndeterminee: Math.round((signedQuotes || []).filter(q => !q.vertical).reduce((s, q) => s + (Number(q.amount) || 0), 0)),
    caveats: {
      ca_signe: "Synchronisé directement depuis Qonto (devis avec date d'acceptation réelle), toute origine confondue — plus complet que ce qui passe uniquement par le site.",
      ca_encaisse: "N'inclut que les paiements effectivement reçus (acompte et/ou solde) — pas les devis signés en attente de paiement.",
      monthly_trend: "Convertis = statut à ce jour (peut encore évoluer pour les devis récents dont la réponse du client est en attente).",
      previsionnel: "Vue sur l'ensemble des contrats actifs à ce jour, sans filtre de période — le CA signé inclut des prestations dont la date est encore loin (ex. mariages 2027).",
      sources: "Collecte démarrée le 25/08/2026 — aucun historique avant cette date. 'inconnu' regroupe tout ce qui n'a ni clic pub Google Ads ni réponse au menu déclaratif (visite directe, organique, formulaire non renseigné).",
    },
  });
}
