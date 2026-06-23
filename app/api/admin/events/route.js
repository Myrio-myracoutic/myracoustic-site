import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*, clients(id, first_name, last_name, email, phone, profil), event_guests(id, attending)')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Enrichir chaque événement avec les stats invités
  const enriched = (data || []).map(ev => {
    const guestList = ev.event_guests || [];
    return {
      ...ev,
      guest_count:    guestList.length,
      guest_present:  guestList.filter(g => g.attending === true).length,
      guest_pending:  guestList.filter(g => g.attending === null).length,
    };
  });

  return Response.json(enriched);
}
