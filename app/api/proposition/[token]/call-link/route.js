import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { ensureCallToken } from '@/app/lib/call-booking';

// GET — lien de prise de rendez-vous (créé à la demande, pas à chaque vue de la proposition) :
// réutilise le moteur d'appel existant côté mariage_leads, même "kind" que les autres tunnels.
export async function GET(_req, { params }) {
  const { token } = await params;
  const { data: p } = await supabaseAdmin
    .from('devis_proposals').select('lead_id').eq('token', token).maybeSingle();
  if (!p?.lead_id) return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });

  const callToken = await ensureCallToken({ kind: 'mariage', refId: p.lead_id });
  if (!callToken) return NextResponse.json({ error: 'Lien indisponible' }, { status: 500 });

  return NextResponse.json({ token: callToken });
}
