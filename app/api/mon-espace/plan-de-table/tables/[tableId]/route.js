import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyWeddingOrgAccess } from '@/app/lib/event-access';

function bearer(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '');
}

async function authForTable(request, tableId) {
  const token = bearer(request);
  if (!token) return { error: 'Non autorisé', status: 401 };
  const { data: table } = await supabaseAdmin.from('event_tables').select('id, event_id').eq('id', tableId).single();
  if (!table) return { error: 'Table introuvable', status: 404 };
  const access = await verifyEventAccess(token, table.event_id);
  if (!access) return { error: 'Non autorisé', status: 403 };
  if (!(await verifyWeddingOrgAccess(table.event_id))) return { error: 'Non autorisé', status: 403 };
  return { table };
}

/* PATCH — renommer / changer la capacité */
export async function PATCH(request, { params }) {
  const { tableId } = await params;
  const auth = await authForTable(request, tableId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const updates = {};
  if (typeof body.name === 'string') updates.name = body.name.trim() || 'Table';
  if (Number.isFinite(body.capacity)) updates.capacity = Math.max(1, Math.min(50, body.capacity));
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabaseAdmin.from('event_tables').update(updates).eq('id', tableId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* DELETE — supprimer la table (les convives placés repassent non placés via ON DELETE SET NULL) */
export async function DELETE(request, { params }) {
  const { tableId } = await params;
  const auth = await authForTable(request, tableId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabaseAdmin.from('event_tables').delete().eq('id', tableId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
