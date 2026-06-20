import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const [{ data: events }, { count: totalClients }] = await Promise.all([
    supabaseAdmin
      .from('events')
      .select('*, clients(first_name, last_name, email)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
  ]);

  const all = events || [];

  // Par statut
  const byStatus = {};
  ['devis_envoye', 'accepte', 'confirme', 'termine', 'annule'].forEach(s => {
    byStatus[s] = all.filter(e => e.status === s).length;
  });

  // Par mois (6 derniers)
  const byMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const count = all.filter(e => e.created_at?.startsWith(key)).length;
    byMonth.push({ key, label, count });
  }

  // Prochain événement
  const today = new Date().toISOString().split('T')[0];
  const nextEvent = all
    .filter(e => e.event_date && e.event_date >= today && e.status !== 'annule')
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0] || null;

  // Taux de conversion
  const total = all.length;
  const converted = all.filter(e => ['accepte', 'confirme', 'termine'].includes(e.status)).length;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  // Ce mois
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = all.filter(e => e.created_at?.startsWith(thisMonth)).length;

  return Response.json({
    total,
    thisMonthCount,
    converted,
    conversionRate,
    totalClients: totalClients || 0,
    byStatus,
    byMonth,
    nextEvent,
    recentEvents: all.slice(0, 6),
  });
}
