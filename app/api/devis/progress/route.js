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
  const { email, step, data } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('devis_particulier_progress')
    .upsert({ email, step, data, updated_at: new Date().toISOString() });

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
