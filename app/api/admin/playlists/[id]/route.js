import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

// PATCH /api/admin/playlists/[id] — visibilité de la playlist
// Body : { visibility: 'all' | 'hide_couple' | 'hide_collaborators' | 'hide_marie' | 'hide_mariee' }
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const { visibility } = await req.json();

  const map = {
    all:                { is_surprise: false, hidden_from_collaborators: false, hidden_from_role: null },
    hide_couple:        { is_surprise: true,  hidden_from_collaborators: false, hidden_from_role: null }, // cachée aux mariés
    hide_collaborators: { is_surprise: false, hidden_from_collaborators: true,  hidden_from_role: null }, // cachée aux accès partagés
    hide_marie:         { is_surprise: false, hidden_from_collaborators: false, hidden_from_role: 'marie'  }, // cachée au marié seulement
    hide_mariee:        { is_surprise: false, hidden_from_collaborators: false, hidden_from_role: 'mariee' }, // cachée à la mariée seulement
  };
  const updates = map[visibility];
  if (!updates) return Response.json({ error: 'visibility invalide' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('playlists').update(updates).eq('id', id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ playlist: data });
}
