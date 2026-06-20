import { NextResponse } from 'next/server';
import { searchTracks } from '@/app/lib/tidal';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

  if (!q || q.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await searchTracks(q, limit);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('Tidal search error:', err.message);
    return NextResponse.json({ tracks: [], error: err.message }, { status: 502 });
  }
}
