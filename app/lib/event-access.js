import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase-admin';

export function getSupabaseClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

/**
 * Vérifie qu'un utilisateur (propriétaire ou collaborateur) a accès à un événement.
 * @returns {{ clientId: string, isCollaborator: boolean } | null}
 */
export async function verifyEventAccess(token, eventId) {
  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Propriétaire principal
  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();

  if (client) {
    const { data: ev } = await supabaseAdmin
      .from('events').select('id').eq('id', eventId).eq('client_id', client.id).single();
    if (ev) return { clientId: client.id, isCollaborator: false };
  }

  // 2. Collaborateur
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('event_id, events(client_id)')
    .eq('auth_id', user.id)
    .eq('event_id', eventId)
    .single();

  if (collab) return { clientId: collab.events?.client_id, isCollaborator: true };

  return null;
}

/**
 * Identifie l'utilisateur et son client_id sans connaître l'eventId à l'avance.
 * Utile pour les routes qui reçoivent un playlistId ou itemId (pas directement l'eventId).
 * @returns {{ userId: string, clientId: string | null, isCollaborator: boolean } | null}
 */
export async function getAuthContext(token) {
  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabaseAdmin
    .from('clients').select('id').eq('auth_id', user.id).single();

  if (client) return { userId: user.id, clientId: client.id, isCollaborator: false };

  // Collaborateur — pas de clientId direct, mais on peut vérifier par eventId si besoin
  return { userId: user.id, clientId: null, isCollaborator: true };
}

/**
 * Vérifie qu'un utilisateur (propriétaire ou collaborateur) a accès à une playlist.
 * @returns {{ clientId: string, isCollaborator: boolean } | null}
 */
export async function verifyPlaylistAccess(token, playlistId) {
  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pl } = await supabaseAdmin
    .from('playlists')
    .select('id, event_id, events(id, client_id, clients(auth_id))')
    .eq('id', playlistId)
    .single();

  if (!pl) return null;
  const ev = pl.events;

  // Propriétaire
  if (ev?.clients?.auth_id === user.id)
    return { clientId: ev.client_id, isCollaborator: false };

  // Collaborateur
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('id')
    .eq('auth_id', user.id)
    .eq('event_id', pl.event_id)
    .single();

  if (collab) return { clientId: ev?.client_id, isCollaborator: true };
  return null;
}
