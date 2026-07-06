import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// PATCH /api/admin/playlists/[id] — visibilité de la playlist
// Body : { visibility: 'all' | 'hide_couple' | 'hide_collaborators' }
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const { visibility } = await req.json();

  const map = {
    all:                { is_surprise: false, hidden_from_collaborators: false },
    hide_couple:        { is_surprise: true,  hidden_from_collaborators: false }, // cachée aux mariés
    hide_collaborators: { is_surprise: false, hidden_from_collaborators: true  }, // cachée aux accès partagés
  };
  const updates = map[visibility];
  if (!updates) return Response.json({ error: 'visibility invalide' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlists').update(updates).eq('id', id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ playlist: data });
}
