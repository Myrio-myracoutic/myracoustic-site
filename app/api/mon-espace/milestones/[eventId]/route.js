import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';
import { MILESTONE_LABELS } from '@/app/lib/call-booking';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const MILESTONE_ORDER = ['presentation', 'visite_lieu', 'point_1_mois', 'reglages_2_semaines'];

// GET /api/mon-espace/milestones/[eventId] — les rendez-vous d'accompagnement du client
// (présentation de la plateforme, visite du lieu, points d'étape), avec le lien de réservation
// pour ceux pas encore pris. Voir supabase-migrations/2026-09-14_event_milestones.sql.
export async function GET(req, { params }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { eventId } = await params;
  const access = await verifyEventAccess(token, eventId);
  if (!access) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('event_milestones')
    .select('milestone_type, call_scheduled_at, call_cancelled_at, call_token')
    .eq('event_id', eventId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const milestones = MILESTONE_ORDER
    .map(type => (data || []).find(m => m.milestone_type === type))
    .filter(Boolean)
    .map(m => ({
      milestone_type: m.milestone_type,
      label: MILESTONE_LABELS[m.milestone_type],
      scheduledAt: (m.call_scheduled_at && !m.call_cancelled_at) ? m.call_scheduled_at : null,
      bookingUrl: m.call_token ? `${APP_URL}/rendez-vous/${m.call_token}` : null,
    }));

  return Response.json({ milestones });
}
