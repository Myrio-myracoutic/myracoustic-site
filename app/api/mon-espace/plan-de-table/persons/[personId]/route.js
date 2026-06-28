import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

function bearer(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '');
}

/* PATCH — assigner/retirer d'une table (tableId ou null) et/ou renommer le convive */
export async function PATCH(request, { params }) {
  const { personId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: person } = await supabaseAdmin
    .from('event_persons').select('id, event_id').eq('id', personId).single();
  if (!person) return NextResponse.json({ error: 'Convive introuvable' }, { status: 404 });

  const access = await verifyEventAccess(token, person.event_id);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const updates = {};
  if ('tableId' in body) {
    // Vérifier que la table appartient au même événement (ou null pour retirer)
    if (body.tableId === null) {
      updates.table_id = null;
    } else {
      const { data: t } = await supabaseAdmin.from('event_tables').select('id').eq('id', body.tableId).eq('event_id', person.event_id).single();
      if (!t) return NextResponse.json({ error: 'Table invalide' }, { status: 400 });
      updates.table_id = body.tableId;
    }
  }
  if (typeof body.name === 'string') updates.name = body.name.trim() || null;
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabaseAdmin.from('event_persons').update(updates).eq('id', personId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* DELETE — supprimer un convive MANUEL uniquement (les convives RSVP sont gérés par la synchro) */
export async function DELETE(request, { params }) {
  const { personId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: person } = await supabaseAdmin
    .from('event_persons').select('id, event_id, guest_id').eq('id', personId).single();
  if (!person) return NextResponse.json({ error: 'Convive introuvable' }, { status: 404 });
  if (person.guest_id) return NextResponse.json({ error: 'Convive issu d\'un RSVP — gérez-le dans la section Invités' }, { status: 400 });

  const access = await verifyEventAccess(token, person.event_id);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin.from('event_persons').delete().eq('id', personId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
