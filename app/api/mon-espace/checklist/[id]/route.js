import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

export async function PATCH(req, { params }) {
  const { token, checked } = await req.json();
  if (!token || !Array.isArray(checked))
    return Response.json({ error: 'Paramètres manquants' }, { status: 400 });

  const { id } = await params;

  const access = await verifyEventAccess(token, id);
  if (!access) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('events')
    .update({ checklist_checked: checked, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
