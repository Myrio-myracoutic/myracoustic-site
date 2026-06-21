import { createClient } from '@supabase/supabase-js';

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId } = await params;
  const supabase = getSupabase(token);

  const { data, error } = await supabase
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
  const { time, label, position } = await req.json();
  if (!time || !label) return Response.json({ error: 'time et label requis' }, { status: 400 });

  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from('event_programme')
    .insert({ event_id: eventId, time, label, position: position ?? 0 })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ item: data }, { status: 201 });
}
