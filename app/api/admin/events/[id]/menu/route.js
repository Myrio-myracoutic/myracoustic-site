import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* GET — config du module menu + réponses des invités (lecture admin) */
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data: config } = await supabaseAdmin
    .from('event_menu_config')
    .select('*')
    .eq('event_id', id)
    .maybeSingle();

  const { data: guests } = await supabaseAdmin
    .from('event_guests')
    .select('id, first_name, attending, menu_response')
    .eq('event_id', id)
    .order('first_name');

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('event_type, event_date, venue_city, clients(first_name, last_name)')
    .eq('id', id)
    .maybeSingle();

  const event = ev ? {
    type:   ev.event_type,
    date:   ev.event_date,
    city:   ev.venue_city,
    client: ev.clients ? `${ev.clients.first_name || ''} ${ev.clients.last_name || ''}`.trim() : '',
  } : null;

  return Response.json({ config: config || null, guests: guests || [], event });
}
