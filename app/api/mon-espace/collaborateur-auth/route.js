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

  // Chercher par auth_id (connexions suivantes, ou compte provisionné dès l'invitation)
  let collab = (await supabaseAdmin
    .from('event_collaborators')
    .select('id, event_id, auth_id, email, role, can_see_billing, accepted_at, events(*, clients(*))')
    .eq('auth_id', user.id)
    .single()).data;

  // Chercher par email (compte pas encore lié)
  if (!collab) {
    collab = (await supabaseAdmin
      .from('event_collaborators')
      .select('id, event_id, email, role, can_see_billing, accepted_at, events(*, clients(*))')
      .eq('email', user.email?.toLowerCase() || '')
      .single()).data;

    if (collab) {
      await supabaseAdmin
        .from('event_collaborators')
        .update({ auth_id: user.id })
        .eq('id', collab.id);
    }
  }

  // auth_id est souvent déjà posé dès l'invitation (compte provisionné à l'avance) :
  // accepted_at doit donc être posé ici, à la première connexion réelle constatée,
  // et pas seulement dans la branche "trouvé par email" ci-dessus.
  if (collab && !collab.accepted_at) {
    await supabaseAdmin
      .from('event_collaborators')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', collab.id);
  }

  if (!collab?.events) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    canSeeBilling: !!collab.can_see_billing,
    role: collab.role || null,
    event: collab.events,
    client: collab.events.clients,
  });
}
