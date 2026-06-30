import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess, verifyWeddingOrgAccess } from '@/app/lib/event-access';

function bearer(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '');
}

/* GET — config du module menu + réponses consolidées des invités */
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: config } = await supabaseAdmin
    .from('event_menu_config')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  const { data: guests } = await supabaseAdmin
    .from('event_guests')
    .select('id, first_name, email, attending, adults_count, children_count, menu_response')
    .eq('event_id', eventId)
    .order('first_name');

  return NextResponse.json({ config: config || null, guests: guests || [] });
}

/* PUT — créer / mettre à jour la config du module menu */
export async function PUT(request, { params }) {
  const { eventId } = await params;
  const token = bearer(request);
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  if (!(await verifyWeddingOrgAccess(eventId))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const payload = {
    event_id:      eventId,
    is_active:     !!body.isActive,
    service_type:  body.serviceType === 'buffet' ? 'buffet' : 'plated',
    courses:       Array.isArray(body.courses) ? body.courses : [],
    ask_dietary:   body.askDietary !== false,
    ask_cake:      !!body.askCake,
    ask_drinks:    !!body.askDrinks,
    drink_options: Array.isArray(body.drinkOptions) ? body.drinkOptions : [],
    ask_comment:   !!body.askComment,
    intro_text:    body.introText ?? null,
    updated_at:    new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('event_menu_config')
    .upsert(payload, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, config: data });
}
