import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* GET — suggestions de l'invité (pour qu'il voie ses propres propositions) */
export async function GET(request, { params }) {
  const { token } = await params;
  const { data: guest } = await supabaseAdmin
    .from('event_guests').select('id').eq('token', token).single();
  if (!guest) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });

  const { data } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('id, title, artist, cover_url, playlist_id, playlists(name)')
    .eq('guest_id', guest.id)
    .order('created_at');

  return NextResponse.json({ suggestions: data || [] });
}
