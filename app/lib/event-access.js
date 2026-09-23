import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase-admin';

const FORMULE_RANK = { essentiel: 1, signature: 2, prestige: 3 };

export function getSupabaseClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

/**
 * Un compte "conjoint" (titulaire principal, ou accès partagé marié/mariée) est traité
 * comme "les mariés" pour la visibilité des surprises. Un Wedding Planner voit tout.
 */
export function isSpouseAccess(access) {
  return !!access && (!access.isCollaborator || access.role === 'marie' || access.role === 'mariee');
}
export function isPlannerAccess(access) {
  return !!access && access.role === 'wedding_planner';
}
export function otherSpouseRole(role) {
  if (role === 'marie') return 'mariee';
  if (role === 'mariee') return 'marie';
  return null;
}

/**
 * Détermine si une playlist est cachée pour ce compte, tous types de masquage confondus :
 * - is_surprise         → cachée à TOUS les mariés (peu importe marié/mariée)
 * - hidden_from_role     → cachée à UN SEUL conjoint (le marié OU la mariée, pas les deux)
 * - hidden_from_collaborators → cachée aux accès partagés classiques
 * Le Wedding Planner voit toujours tout.
 */
export function isPlaylistHiddenFor(playlist, access) {
  if (isPlannerAccess(access)) return false;
  if (isSpouseAccess(access)) {
    if (playlist.is_surprise) return true;
    if (playlist.hidden_from_role && playlist.hidden_from_role === access.role) return true;
    return false;
  }
  return !!playlist.hidden_from_collaborators;
}

/**
 * Vérifie qu'un utilisateur (propriétaire ou collaborateur) a accès à un événement.
 * @returns {{ clientId: string, isCollaborator: boolean, role: string|null } | null}
 */
export async function verifyEventAccess(token, eventId) {
  const supabase = getSupabaseClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Propriétaire principal
  const { data: client } = await supabaseAdmin
    .from('clients').select('id, civil_role').eq('auth_id', user.id).single();

  if (client) {
    const { data: ev } = await supabaseAdmin
      .from('events').select('id').eq('id', eventId).eq('client_id', client.id).single();
    // Le titulaire du compte voit toujours sa propre facturation.
    if (ev) return { clientId: client.id, isCollaborator: false, role: client.civil_role || null, userId: user.id, canSeeBilling: true };
  }

  // 2. Collaborateur
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('event_id, role, can_see_billing, events(client_id)')
    .eq('auth_id', user.id)
    .eq('event_id', eventId)
    .single();

  if (collab) return { clientId: collab.events?.client_id, isCollaborator: true, role: collab.role, userId: user.id, canSeeBilling: !!collab.can_see_billing };

  return null;
}

/**
 * Vérifie que l'événement donne accès aux modules mariage premium
 * (invités, menu, plan de table, faire-part) : réservés aux mariages
 * formule Signature+ (les mariages sans formule renseignée, comptes
 * historiques, restent ouverts).
 * @returns {Promise<boolean>}
 */
export async function verifyWeddingOrgAccess(eventId) {
  const { data: ev } = await supabaseAdmin
    .from('events').select('event_type, formule').eq('id', eventId).single();
  if (!ev || ev.event_type !== 'Mariage') return false;
  if (!ev.formule) return true;
  return (FORMULE_RANK[ev.formule] || 0) >= FORMULE_RANK.signature;
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
    .from('clients').select('id, civil_role').eq('auth_id', user.id).single();

  if (client) return { userId: user.id, clientId: client.id, isCollaborator: false, role: client.civil_role || null };

  // Collaborateur — pas de clientId direct, mais on peut vérifier par eventId si besoin
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators').select('role').eq('auth_id', user.id).single();

  return { userId: user.id, clientId: null, isCollaborator: true, role: collab?.role || null };
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
    .select('id, event_id, events(id, client_id, clients(auth_id, civil_role))')
    .eq('id', playlistId)
    .single();

  if (!pl) return null;
  const ev = pl.events;

  // Propriétaire
  if (ev?.clients?.auth_id === user.id)
    return { clientId: ev.client_id, isCollaborator: false, role: ev.clients.civil_role || null, userId: user.id };

  // Collaborateur
  const { data: collab } = await supabaseAdmin
    .from('event_collaborators')
    .select('id, role')
    .eq('auth_id', user.id)
    .eq('event_id', pl.event_id)
    .single();

  if (collab) return { clientId: ev?.client_id, isCollaborator: true, role: collab.role, userId: user.id };
  return null;
}
