import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function PATCH(req, { params }) {
  const { token, checked } = await req.json();
  if (!token || !Array.isArray(checked)) {
    return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data: clientData } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!clientData) return Response.json({ error: 'Client introuvable' }, { status: 403 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, client_id')
    .eq('id', params.id)
    .eq('client_id', clientData.id)
    .single();

  if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('events')
    .update({ checklist_checked: checked, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
