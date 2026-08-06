import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { isDateInBookingWindow, ADMIN_BOOKING_WINDOW_DAYS } from '@/lib/call-slots';
import { bookCallSlot, deleteCallGoogleEvent, cancelCallSlot } from '@/app/lib/call-booking';

// GET /api/admin/mariage-leads — leads du formulaire de contact mariage
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data: leads, error } = await supabaseAdmin
    .from('mariage_leads')
    .select('id, created_at, prenom, nom, tel, email, event_date, guests, lieu, message, status, client_id, call_scheduled_at, call_google_event_id, call_cancelled_at')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Proposition liée (complète, pour l'affichage + la modification)
  const { data: props } = await supabaseAdmin
    .from('devis_proposals')
    .select('id, lead_id, client_id, status, total, formule, formule_name, items, admin_note, valid_until, discount_type, discount_value, discount_until, viewed_count, last_viewed_at');
  const byLead = {};
  for (const p of props || []) if (p.lead_id) byLead[p.lead_id] = p;

  // Événements existants (pour savoir si l'espace mariage est déjà ouvert)
  const clientIds = (props || []).map(p => p.client_id).filter(Boolean);
  const eventsByClient = {};
  if (clientIds.length) {
    const { data: evs } = await supabaseAdmin.from('events').select('id, client_id').in('client_id', clientIds);
    for (const e of evs || []) eventsByClient[e.client_id] = e.id;
  }

  const enriched = (leads || []).map(l => {
    const p = byLead[l.id] || null;
    return { ...l, proposal: p ? { ...p, event_id: p.client_id ? eventsByClient[p.client_id] || null : null } : null };
  });
  return Response.json({ leads: enriched });
}

// POST /api/admin/mariage-leads — créer un contact à la main (démarchage direct, bouche-à-oreille…)
// Contact déjà en relation avec Myrio → AUCUN email envoyé (contrairement au formulaire public).
export async function POST(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { prenom, nom, tel, email, date, guests, lieu, message } = await request.json();
  if (!prenom?.trim() || !nom?.trim() || !tel?.trim() || !email?.trim()) {
    return Response.json({ error: 'Prénom, nom, téléphone et email sont requis.' }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from('mariage_leads').insert({
    prenom: prenom.trim(),
    nom: nom.trim(),
    tel: tel.trim(),
    email: email.trim().toLowerCase(),
    event_date: date || null,
    guests: guests ? parseInt(guests, 10) || null : null,
    lieu: lieu?.trim() || null,
    message: message?.trim() || null,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// PATCH /api/admin/mariage-leads — actions ponctuelles sur un lead :
// - cancelCall: true → annule un appel réservé, sans en reprogrammer un autre
// - setCall: { date, time } → programme un appel (lead sans créneau) OU le déplace
//   (lead déjà programmé — supprime l'ancien événement Google avant de créer le nouveau)
export async function PATCH(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id, cancelCall, setCall } = await request.json();
  if (!id) return Response.json({ error: 'id manquant' }, { status: 400 });

  if (cancelCall) {
    const result = await cancelCallSlot({ kind: 'mariage', refId: id });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  if (setCall) {
    const { date, time } = setCall;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !/^\d{2}:\d{2}$/.test(time)) {
      return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    if (!isDateInBookingWindow(date, ADMIN_BOOKING_WINDOW_DAYS)) {
      return Response.json({ error: 'Date hors de la fenêtre autorisée' }, { status: 400 });
    }

    // Reprogrammation (lead déjà programmé) : l'ancien événement Google ne doit plus
    // apparaître, et l'email de confirmation doit dire « modifié » plutôt que « confirmé ».
    const { data: lead } = await supabaseAdmin
      .from('mariage_leads').select('call_google_event_id, call_scheduled_at, call_cancelled_at').eq('id', id).maybeSingle();
    const isReschedule = !!lead?.call_scheduled_at && !lead?.call_cancelled_at;
    await deleteCallGoogleEvent(lead?.call_google_event_id);

    const result = await bookCallSlot({ kind: 'mariage', refId: id, date, time, requireEmptySlot: false, windowDays: ADMIN_BOOKING_WINDOW_DAYS, isReschedule });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Action inconnue' }, { status: 400 });
}

// DELETE /api/admin/mariage-leads — supprimer un lead
export async function DELETE(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await request.json();
  await supabaseAdmin.from('mariage_leads').delete().eq('id', id);
  return Response.json({ ok: true });
}
