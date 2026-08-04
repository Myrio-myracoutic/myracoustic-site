import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { GOOGLE_REVIEW_URL, MARIAGENET_REVIEW_URL } from '@/app/lib/review-links';

// GET /api/track/avis?eventId=xxx&type=google|mariagenet
// Route publique — enregistre le clic puis redirige vers la vraie page d'avis.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const type = searchParams.get('type');

  const destination = type === 'mariagenet' ? MARIAGENET_REVIEW_URL : GOOGLE_REVIEW_URL;

  if (eventId && ['google', 'mariagenet'].includes(type)) {
    const field = type === 'mariagenet' ? 'avis_mariagenet_clicked_at' : 'avis_google_clicked_at';
    await supabaseAdmin.from('events').update({ [field]: new Date().toISOString() }).eq('id', eventId);
  }

  return NextResponse.redirect(destination, { status: 302 });
}
