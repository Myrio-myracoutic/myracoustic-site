import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

async function getItemEventAccess(token, id) {
  const { data: item } = await supabaseAdmin
    .from('event_programme').select('event_id').eq('id', id).single();
  if (!item) return null;
  const access = await verifyEventAccess(token, item.event_id);
  return access ? item : null;
}

export async function PATCH(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const item = await getItemEventAccess(token, id);
  if (!item) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await req.json();
  // secret_animation et secret_visible sont réservés à l'admin
  const CLIENT_FIELDS = ['time', 'label', 'position', 'playlist_ids', 'instructions'];
  const updates = {};
  for (const k of CLIENT_FIELDS) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  if (!Object.keys(updates).length)
    return Response.json({ error: 'Aucun champ valide' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('event_programme').update(updates).eq('id', id).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ item: data });
}

export async function DELETE(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const item = await getItemEventAccess(token, id);
  if (!item) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin.from('event_programme').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
