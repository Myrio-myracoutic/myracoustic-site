import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

async function generatePlaylists(eventId, eventType) {
  // Récupère les modèles pour ce type d'événement
  const { data: templates } = await supabaseAdmin
    .from('playlist_templates')
    .select('name, position')
    .eq('event_type', eventType)
    .order('position');

  if (!templates?.length) return;

  // Vérifie que des playlists n'existent pas déjà
  const { count } = await supabaseAdmin
    .from('playlists')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (count > 0) return; // Déjà générées

  await supabaseAdmin.from('playlists').insert(
    templates.map(t => ({ event_id: eventId, name: t.name, position: t.position }))
  );
}

export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*, clients(*)')
    .eq('id', id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updates = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) updates.status = body.status;
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
  if (body.client_message !== undefined) updates.client_message = body.client_message;
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Auto-génère les playlists au premier passage en statut "accepté"
  if (body.status === 'accepte' && data.event_type) {
    await generatePlaylists(id, data.event_type).catch(e =>
      console.error('generatePlaylists error:', e.message)
    );
  }

  return Response.json(data);
}
