import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query)
    return NextResponse.json({ error: "Query required" }, { status: 400 });

  // 1. HEADER SAKTI (Persis seperti Log Browser Anda)
  const baseHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://dabmusic.xyz/",
    Origin: "https://dabmusic.xyz",
    "Sec-Ch-Ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };

  try {
    // --- TAHAP 1: SEARCH (Dapatkan ID + Cookie) ---
    const searchUrl = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(
      query
    )}&type=track&offset=0`;

    console.log(`[1] Searching: ${query}`);

    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: baseHeaders,
    });

    if (!searchRes.ok) {
      throw new Error(
        `Search Gagal: ${searchRes.status} ${searchRes.statusText}`
      );
    }

    // PENTING: Ambil Cookie dari response Search (ini tiket masuk kita)
    const cookies = searchRes.headers.get("set-cookie") || "";

    const searchData = await searchRes.json();
    const trackData = searchData.tracks?.[0];

    if (!trackData) {
      return NextResponse.json(
        { error: "Lagu tidak ditemukan" },
        { status: 404 }
      );
    }

    const trackId = trackData.id;
    console.log(`[2] Found ID: ${trackId} | Cookies obtained.`);

    // --- TAHAP 2: STREAM (Pakai ID + Cookie tadi) ---
    const streamUrl = `https://dabmusic.xyz/api/stream?trackId=${trackId}`;

    const streamRes = await fetch(streamUrl, {
      method: "GET",
      headers: {
        ...baseHeaders,
        Cookie: cookies, // <--- INI KUNCINYA
      },
    });

    if (!streamRes.ok) {
      // Coba baca error textnya jika ada
      const errText = await streamRes.text();
      console.error("Stream Error Body:", errText);
      throw new Error(
        `Stream Gagal: ${streamRes.status} (Mungkin IP CodeSandbox diblokir)`
      );
    }

    const streamData = await streamRes.json();

    if (!streamData.url) {
      return NextResponse.json({ error: "URL Audio kosong" }, { status: 500 });
    }

    return NextResponse.json({ url: streamData.url });
  } catch (error: any) {
    console.error("FINAL ERROR:", error.message);
    return NextResponse.json(
      {
        error: "Gagal memproses request",
        detail: error.message,
      },
      { status: 500 }
    ); // Return 500 jangan 403 agar frontend tidak bingung
  }
}
