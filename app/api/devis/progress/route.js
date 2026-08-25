import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

export async function GET(request) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('devis_particulier_progress')
    .select('step, data, updated_at')
    .eq('email', email)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

export async function POST(request) {
  const { email, step, data, gclid, utm_source, utm_medium, utm_campaign, sourceDeclared } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const upsertRow = { email, step, data, updated_at: new Date().toISOString() };

  // Origine du prospect : premier contact gagne. On n'inclut les colonnes d'attribution dans
  // l'upsert QUE si aucune n'est déjà posée pour cet email — sinon un autosave plus tardif (sans
  // gclid dans l'URL, ex. le client revient direct) écraserait la preuve d'un clic pub antérieur.
  const { data: existing } = await supabaseAdmin
    .from('devis_particulier_progress')
    .select('gclid, source')
    .eq('email', email)
    .maybeSingle();
  if (!existing?.gclid && !existing?.source) {
    const source = gclid ? 'google_ads' : (sourceDeclared || null);
    Object.assign(upsertRow, {
      gclid: gclid || null, utm_source: utm_source || null,
      utm_medium: utm_medium || null, utm_campaign: utm_campaign || null, source,
    });
  }

  const { error } = await supabaseAdmin
    .from('devis_particulier_progress')
    .upsert(upsertRow);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('devis_particulier_progress')
    .delete()
    .eq('email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
