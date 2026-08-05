import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET — planning complet (toutes les plages, tous les jours) + durée d'un créneau.
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const [{ data: rows, error }, { data: settings }] = await Promise.all([
    supabaseAdmin.from('call_schedule').select('weekday, start_time, end_time, enabled').order('weekday').order('start_time'),
    supabaseAdmin.from('call_settings').select('slot_duration_minutes').eq('id', 1).maybeSingle(),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ rows: rows || [], slotDurationMinutes: settings?.slot_duration_minutes || 15 });
}

// PUT — remplace le planning en bloc + met à jour la durée d'un créneau.
// Payload : { days: [{ weekday: 0, enabled: true, ranges: [{start:'09:00', end:'18:00'}] }, ...], slotDurationMinutes: 15 }
export async function PUT(request) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { days, slotDurationMinutes } = await request.json();
  if (!Array.isArray(days)) {
    return Response.json({ error: 'Format invalide' }, { status: 400 });
  }
  const duration = Number(slotDurationMinutes);
  if (!Number.isInteger(duration) || duration <= 0 || duration > 240) {
    return Response.json({ error: 'Durée de créneau invalide' }, { status: 400 });
  }

  const rows = [];
  for (const day of days) {
    const weekday = Number(day.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
    if (!day.enabled) continue; // jour désactivé : aucune plage enregistrée
    for (const r of day.ranges || []) {
      if (!/^\d{2}:\d{2}$/.test(r.start) || !/^\d{2}:\d{2}$/.test(r.end) || r.end <= r.start) continue;
      rows.push({ weekday, start_time: r.start, end_time: r.end, enabled: true });
    }
  }

  // Remplacement complet (trafic très faible sur cette route, pas besoin de diff fin).
  const { error: delErr } = await supabaseAdmin.from('call_schedule').delete().gte('weekday', 0);
  if (delErr) return Response.json({ error: delErr.message }, { status: 500 });

  if (rows.length) {
    const { error: insErr } = await supabaseAdmin.from('call_schedule').insert(rows);
    if (insErr) return Response.json({ error: insErr.message }, { status: 500 });
  }

  const { error: settingsErr } = await supabaseAdmin
    .from('call_settings')
    .upsert({ id: 1, slot_duration_minutes: duration, updated_at: new Date().toISOString() });
  if (settingsErr) return Response.json({ error: settingsErr.message }, { status: 500 });

  return Response.json({ ok: true });
}
