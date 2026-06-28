import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';
import { getEventGallery } from '@/app/lib/gallery';

// GET — galerie de l'événement pour le couple (uniquement si Myracoustic l'a publiée)
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: ev } = await supabaseAdmin
    .from('events').select('gallery_published').eq('id', eventId).single();

  if (!ev?.gallery_published) return NextResponse.json({ published: false, photos: [] });

  const photos = await getEventGallery(eventId);
  return NextResponse.json({ published: true, photos });
}
