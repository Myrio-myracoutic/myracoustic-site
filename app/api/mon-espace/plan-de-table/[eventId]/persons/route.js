import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

function bearer(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '');
}

/* POST — ajouter un convive MANUEL (sans invité RSVP rattaché), éventuellement déjà placé sur une table */
export async function POST(request, { params }) {
  const { eventId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  const kind = body.kind === 'child' ? 'child' : 'adult';

  // Valider la table si fournie
  let table_id = null;
  if (body.tableId) {
    const { data: t } = await supabaseAdmin.from('event_tables').select('id').eq('id', body.tableId).eq('event_id', eventId).single();
    if (!t) return NextResponse.json({ error: 'Table invalide' }, { status: 400 });
    table_id = body.tableId;
  }

  const { data, error } = await supabaseAdmin
    .from('event_persons')
    .insert({ event_id: eventId, guest_id: null, kind, name, position: 200, table_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, person: data });
}
