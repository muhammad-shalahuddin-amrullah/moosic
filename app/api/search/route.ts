import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
// Kita perlu import options auth yg kita buat tadi, tapi karena keterbatasan struktur file
// di NextAuth route handler, kita ambil token dari request header saja atau setup authOptions terpisah.
// Untuk simplifikasi di CodeSandbox, kita ambil token yang dikirim dari frontend.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  // Frontend sekarang wajib mengirim token akses user lewat header
  const accessToken = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  if (!q || !accessToken) {
    return NextResponse.json(
      { error: "Query and Token required" },
      { status: 400 }
    );
  }

  try {
    // Search dengan tipe Artist, Album, dan Track
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        q
      )}&type=track,artist,album&limit=5`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return NextResponse.json(searchResponse.data);
  } catch (error) {
    console.error("Spotify Search Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch spotify" },
      { status: 500 }
    );
  }
}
