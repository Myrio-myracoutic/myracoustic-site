import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* Délai de remise : 3 / 7 / 14 jours selon la proximité de l'événement */
function computeDeadline(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(dateStr + 'T12:00:00') - today) / 86400000);
  const delayDays = diff < 90 ? 3 : diff < 180 ? 7 : 14;
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + delayDays);
  return deadline.toISOString().slice(0, 10);
}

/* La date limite de la remise « signature rapide » est figée à la première
   demande pour un couple (email, date d'événement) — un nouveau devis pour
   la même date ne réinitialise pas le compte à rebours. */
export async function POST(request) {
  const { email, date } = await request.json();
  if (!email || !date) return NextResponse.json({ error: 'Email et date requis' }, { status: 400 });

  const { data: existing, error: selErr } = await supabaseAdmin
    .from('devis_remise_offers')
    .select('deadline')
    .eq('email', email)
    .eq('date_evenement', date)
    .maybeSingle();

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

  if (existing) return NextResponse.json({ deadline: existing.deadline });

  const deadline = computeDeadline(date);
  const { error: insErr } = await supabaseAdmin
    .from('devis_remise_offers')
    .insert({ email, date_evenement: date, deadline });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ deadline });
}
