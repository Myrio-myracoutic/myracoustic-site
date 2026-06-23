import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';

export async function GET(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId } = await params;
  const access = await verifyEventAccess(token, eventId);
  if (!access) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('event_programme')
    .select('*')
    .eq('event_id', eventId)
    .order('position')
    .order('time');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data || [] });
}

export async function POST(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId } = await params;
  const access = await verifyEventAccess(token, eventId);
  if (!access) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { time, label, position } = await req.json();
  if (!time || !label) return Response.json({ error: 'time et label requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('event_programme')
    .insert({ event_id: eventId, time, label, position: position ?? 0 })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ item: data }, { status: 201 });
}
