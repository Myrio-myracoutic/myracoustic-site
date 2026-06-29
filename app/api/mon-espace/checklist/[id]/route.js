import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

export async function PATCH(req, { params }) {
  const body = await req.json();
  const { token, checked, items } = body;
  if (!token) return Response.json({ error: 'Paramètres manquants' }, { status: 400 });

  const { id } = await params;

  const access = await verifyEventAccess(token, id);
  if (!access) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const updates = { updated_at: new Date().toISOString() };
  if (Array.isArray(items)) {
    updates.checklist_items   = items;
    updates.checklist_checked = items.filter(i => i.done).map(i => i.text);
  } else if (Array.isArray(checked)) {
    updates.checklist_checked = checked;
  } else {
    return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
