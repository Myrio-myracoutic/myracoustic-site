import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyWeddingOrgAccess } from '@/app/lib/event-access';

// GET /api/mon-espace/fairepart/[eventId]
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('event_page')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  return NextResponse.json({ page: data || null });
}

// POST /api/mon-espace/fairepart/[eventId] — upsert
export async function POST(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { title, subtitle, message, is_published, practical_info } = await request.json();

  const row = { event_id: eventId, title, subtitle, message, is_published };
  if (practical_info !== undefined && practical_info !== null && typeof practical_info === 'object')
    row.practical_info = practical_info;

  const { data, error } = await supabaseAdmin
    .from('event_page')
    .upsert(row, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}
