import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { verifyEventAccess } from '@/app/lib/event-access';
import { getEventGallery } from '@/app/lib/gallery';

// GET — galerie de l'événement pour le couple (visible dès qu'une photo est ajoutée)
export async function GET(request, { params }) {
  const { eventId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const access = await verifyEventAccess(token, eventId);
  if (!access) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const photos = await getEventGallery(eventId);
  return NextResponse.json({ published: photos.length > 0, photos });
}
