import { NextResponse } from 'next/server';

// GET /api/music/preview?deezer_id=...  (ou ?q=titre artiste)
// Renvoie une URL d'extrait Deezer FRAÎCHE (les URLs d'extrait expirent),
// résolue par id exact si possible, sinon par recherche.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('deezer_id');
  const q  = searchParams.get('q')?.trim();

  try {
    let preview = '';

    if (id) {
      const r = await fetch(`https://api.deezer.com/track/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) { const d = await r.json(); preview = d.preview || ''; }
    }

    if (!preview && q) {
      const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`, {
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) { const d = await r.json(); preview = d.data?.[0]?.preview || ''; }
    }

    return NextResponse.json({ preview });
  } catch (err) {
    return NextResponse.json({ preview: '', error: err.message }, { status: 502 });
  }
}
