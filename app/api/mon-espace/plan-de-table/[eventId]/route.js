import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyWeddingOrgAccess } from '@/app/lib/event-access';

function bearer(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '');
}

/* Synchronise event_persons avec les compteurs RSVP (adultes + enfants) des invités confirmés.
   Préserve les noms et les placements existants ; pré-remplit les noms depuis le module Menu. */
async function syncPersons(eventId) {
  const { data: guests } = await supabaseAdmin
    .from('event_guests')
    .select('id, attending, adults_count, children_count, menu_response')
    .eq('event_id', eventId);

  const confirmed = (guests || []).filter(g => g.attending === true);

  const { data: persons } = await supabaseAdmin
    .from('event_persons')
    .select('*')
    .eq('event_id', eventId);
  const all = persons || [];

  const reconcile = async (guestId, kind, existing, desired, names) => {
    if (existing.length < desired) {
      const toCreate = [];
      for (let i = existing.length; i < desired; i++) {
        toCreate.push({ event_id: eventId, guest_id: guestId, kind, name: names[i] || null, position: kind === 'adult' ? i : 100 + i });
      }
      if (toCreate.length) await supabaseAdmin.from('event_persons').insert(toCreate);
    } else if (existing.length > desired) {
      // Supprimer les surplus : d'abord les non placés, puis les plus récents
      const sorted = [...existing].sort((a, b) => {
        const ap = a.table_id ? 1 : 0, bp = b.table_id ? 1 : 0;
        if (ap !== bp) return ap - bp;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      const toDelete = sorted.slice(0, existing.length - desired).map(p => p.id);
      if (toDelete.length) await supabaseAdmin.from('event_persons').delete().in('id', toDelete);
    }
  };

  for (const g of confirmed) {
    const adults   = Math.max(1, g.adults_count || 1);
    const children = g.children_count || 0;
    const gp = all.filter(p => p.guest_id === g.id);
    const menuPeople = g.menu_response?.people || [];
    const menuAdultNames = menuPeople.filter(p => p.kind === 'adult').map(p => p.name);
    const menuChildNames = menuPeople.filter(p => p.kind === 'child').map(p => p.name);
    await reconcile(g.id, 'adult', gp.filter(p => p.kind === 'adult'), adults, menuAdultNames);
    await reconcile(g.id, 'child', gp.filter(p => p.kind === 'child'), children, menuChildNames);
  }

  // Nettoyer les convives d'invités qui ne sont plus confirmés / supprimés.
  // Les convives MANUELS (guest_id NULL) ne sont jamais touchés par la synchro.
  const confirmedIds = new Set(confirmed.map(g => g.id));
  const orphans = all.filter(p => p.guest_id && !confirmedIds.has(p.guest_id)).map(p => p.id);
  if (orphans.length) await supabaseAdmin.from('event_persons').delete().in('id', orphans);
}

/* GET — synchronise puis renvoie tables + convives + invités (pour les libellés) */
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  await syncPersons(eventId);

  const [{ data: tables }, { data: persons }, { data: guests }] = await Promise.all([
    supabaseAdmin.from('event_tables').select('*').eq('event_id', eventId).order('position').order('created_at'),
    supabaseAdmin.from('event_persons').select('id, guest_id, kind, name, table_id, position').eq('event_id', eventId).order('position'),
    supabaseAdmin.from('event_guests').select('id, first_name').eq('event_id', eventId),
  ]);

  return NextResponse.json({ tables: tables || [], persons: persons || [], guests: guests || [] });
}

/* POST — créer une table */
export async function POST(request, { params }) {
  const { eventId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { count } = await supabaseAdmin.from('event_tables').select('id', { count: 'exact', head: true }).eq('event_id', eventId);

  const { data, error } = await supabaseAdmin
    .from('event_tables')
    .insert({
      event_id: eventId,
      name: body.name?.trim() || `Table ${(count || 0) + 1}`,
      capacity: Number.isFinite(body.capacity) ? body.capacity : 8,
      position: count || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, table: data });
}
