import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// GET — vérifie si l'utilisateur connecté est un collaborateur sur un événement
// Retourne l'événement + le client propriétaire si trouvé
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ found: false }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ found: false }, { status: 401 });

  // Chercher par auth_id (connexions suivantes)
  let collab = (await supabaseAdmin
    .from('event_collaborators')
    .select('id, event_id, auth_id, email, can_see_billing, events(*, clients(*))')
    .eq('auth_id', user.id)
    .single()).data;

  // Chercher par email (première connexion)
  if (!collab) {
    collab = (await supabaseAdmin
      .from('event_collaborators')
      .select('id, event_id, email, can_see_billing, events(*, clients(*))')
      .eq('email', user.email?.toLowerCase() || '')
      .single()).data;

    if (collab) {
      // Mettre à jour auth_id et accepted_at
      await supabaseAdmin
        .from('event_collaborators')
        .update({ auth_id: user.id, accepted_at: new Date().toISOString() })
        .eq('id', collab.id);
    }
  }

  if (!collab?.events) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    canSeeBilling: !!collab.can_see_billing,
    event: collab.events,
    client: collab.events.clients,
  });
}
