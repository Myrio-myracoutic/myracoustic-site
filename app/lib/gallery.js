import { supabaseAdmin } from '@/app/lib/supabase-admin';

export const GALLERY_BUCKET = 'event-gallery';
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 jours

/* Renvoie les photos d'un événement avec une URL signée (bucket privé). */
export async function getEventGallery(eventId) {
  const { data: rows } = await supabaseAdmin
    .from('event_gallery')
    .select('id, path, position, created_at')
    .eq('event_id', eventId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (!rows || rows.length === 0) return [];

  const { data: signed } = await supabaseAdmin
    .storage.from(GALLERY_BUCKET)
    .createSignedUrls(rows.map(r => r.path), SIGNED_TTL);

  const urlByPath = Object.fromEntries((signed || []).map(s => [s.path, s.signedUrl]));
  return rows
    .map(r => ({ id: r.id, url: urlByPath[r.path] || null }))
    .filter(p => p.url);
}
