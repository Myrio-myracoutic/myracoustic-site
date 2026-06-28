import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { getEventGallery, GALLERY_BUCKET } from '@/app/lib/gallery';

export const dynamic = 'force-dynamic';

function extOf(name = '', type = '') {
  const m = (name.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (m) return m.toLowerCase();
  return (type.split('/')[1] || 'jpg').toLowerCase();
}

// GET — liste des photos (URLs signées) + état de publication
export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const [{ data: ev }, photos] = await Promise.all([
    supabaseAdmin.from('events').select('gallery_published').eq('id', id).single(),
    getEventGallery(id),
  ]);

  return NextResponse.json({ photos, published: !!ev?.gallery_published });
}

// POST — téléverser une ou plusieurs photos
export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const form  = await req.formData();
  const files = form.getAll('files').filter(f => typeof f === 'object' && f.size > 0);
  if (!files.length) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

  let uploaded = 0;
  const errors = [];

  for (const file of files) {
    if (!file.type?.startsWith('image/')) { errors.push(`${file.name}: pas une image`); continue; }
    const path = `${id}/${randomUUID()}.${extOf(file.name, file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) { errors.push(`${file.name}: ${upErr.message}`); continue; }

    const { error: dbErr } = await supabaseAdmin
      .from('event_gallery')
      .insert({ event_id: id, path });
    if (dbErr) {
      await supabaseAdmin.storage.from(GALLERY_BUCKET).remove([path]);
      errors.push(`${file.name}: ${dbErr.message}`);
      continue;
    }
    uploaded++;
  }

  return NextResponse.json({ ok: true, uploaded, errors });
}

// PATCH — publier / dépublier la galerie
export async function PATCH(req, { params }) {
  if (!(await verifyAdminCookie())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const { published } = await req.json();

  const { error } = await supabaseAdmin
    .from('events')
    .update({ gallery_published: !!published })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, published: !!published });
}

// DELETE — supprimer une photo (?photoId=...)
export async function DELETE(req, { params }) {
  if (!(await verifyAdminCookie())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const photoId = new URL(req.url).searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId requis' }, { status: 400 });

  const { data: row } = await supabaseAdmin
    .from('event_gallery').select('path').eq('id', photoId).eq('event_id', id).single();
  if (!row) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  await supabaseAdmin.storage.from(GALLERY_BUCKET).remove([row.path]);
  await supabaseAdmin.from('event_gallery').delete().eq('id', photoId);
  return NextResponse.json({ ok: true });
}
