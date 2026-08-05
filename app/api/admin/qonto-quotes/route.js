import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET /api/admin/qonto-quotes — suivi des devis Qonto du tunnel particulier
// (brouillons à finaliser + envoyés en attente + statut réel, cf. 2026-08-05_qonto_quotes_tracking.sql)
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('qonto_quotes_tracking')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ quotes: data || [] });
}
