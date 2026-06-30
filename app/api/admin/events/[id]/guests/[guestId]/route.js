import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* PATCH — modifier prénom, email, téléphone, playlists ou max_songs */
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { guestId } = await params;

  const body = await req.json();
  const updates = {};
  if (body.firstName   !== undefined) updates.first_name  = body.firstName;
  if (body.email       !== undefined) updates.email       = body.email ? body.email.toLowerCase() : null;
  if (body.phone       !== undefined) updates.phone       = body.phone || null;
  if (body.playlistIds !== undefined) updates.playlist_ids = body.playlistIds;
  if (body.maxSongs    !== undefined) updates.max_songs    = body.maxSongs;

  const { data, error } = await supabaseAdmin
    .from('event_guests').update(updates).eq('id', guestId).select().single();
  if (error) {
    if (error.code === '23505')
      return Response.json({ error: 'Cet email est déjà utilisé par un autre invité de cet événement.' }, { status: 409 });
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, guest: data });
}

export async function DELETE(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { guestId } = await params;

  const { error } = await supabaseAdmin.from('event_guests').delete().eq('id', guestId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
