import { NextResponse } from "next/server";
import { gotScraping } from "got-scraping";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query)
    return NextResponse.json({ error: "Query required" }, { status: 400 });

  try {
    // --- TAHAP 1: SEARCH ---
    const searchUrl = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(
      query
    )}&type=track&offset=0`;

    // gotScraping otomatis mengatur User-Agent, Headers, dan TLS Fingerprint mirip Chrome
    const searchRes = await gotScraping.get(searchUrl).json<any>();

    const trackData = searchRes.tracks?.[0];

    if (!trackData) {
      return NextResponse.json(
        { error: "Lagu tidak ditemukan" },
        { status: 404 }
      );
    }

    const trackId = trackData.id;
    console.log(`[Server] Found ID: ${trackId}`);

    // --- TAHAP 2: STREAM ---
    const streamUrl = `https://dabmusic.xyz/api/stream?trackId=${trackId}`;

    // Penting: gotScraping menyimpan cookie sesi secara otomatis jika diperlukan
    const streamRes = await gotScraping.get(streamUrl).json<any>();

    if (!streamRes.url) {
      return NextResponse.json(
        { error: "URL Audio kosong dari sumber" },
        { status: 500 }
      );
    }

    // Berhasil! Kirim URL ke frontend
    return NextResponse.json({ url: streamRes.url });
  } catch (error: any) {
    console.error("[Server Error]:", error.response?.body || error.message);

    // Jika masih kena blokir Cloudflare (biasanya error 403 atau 503)
    if (
      error.response?.statusCode === 403 ||
      error.response?.statusCode === 503
    ) {
      return NextResponse.json(
        {
          error: "Server Vercel terblokir oleh Cloudflare",
          detail: "Cloudflare Challenge triggered",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Gagal memproses request",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
