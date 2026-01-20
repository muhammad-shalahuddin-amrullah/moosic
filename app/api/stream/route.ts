import { NextResponse } from 'next/server';
import { gotScraping } from 'got-scraping';

// PENTING: Mencegah error "Failed to collect page data" saat build
export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query'); 

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    // --- TAHAP 1: SEARCH ---
    const searchUrl = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
    
    // Config khusus untuk menembus Cloudflare
    const searchRes = await gotScraping.get(searchUrl, {
        headers: {
            'Referer': 'https://dabmusic.xyz/',
            'Origin': 'https://dabmusic.xyz'
        }
    }).json<any>();
    
    const trackData = searchRes.tracks?.[0];

    if (!trackData) {
      return NextResponse.json({ error: 'Lagu tidak ditemukan' }, { status: 404 });
    }

    const trackId = trackData.id;
    console.log(`[Server] Found ID: ${trackId}`);

    // --- TAHAP 2: STREAM ---
    const streamUrl = `https://dabmusic.xyz/api/stream?trackId=${trackId}`;
    
    const streamRes = await gotScraping.get(streamUrl, {
        headers: {
            'Referer': 'https://dabmusic.xyz/',
            'Origin': 'https://dabmusic.xyz'
        }
    }).json<any>();

    if (!streamRes.url) {
      return NextResponse.json({ error: 'URL Audio kosong dari sumber' }, { status: 500 });
    }

    return NextResponse.json({ url: streamRes.url });

  } catch (error: any) {
    console.error("[Server Error Details]:", error.code, error.message);
    
    return NextResponse.json({ 
      error: 'Gagal memproses request di server', 
      detail: error.message 
    }, { status: 500 });
  }
}