"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { usePlayer } from "./context/PlayerContext";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const { playTrack } = usePlayer();
  const [recent, setRecent] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);

  useEffect(() => {
    if (session && (session as any).accessToken) {
      const token = (session as any).accessToken;

      // Fetch Recently Played
      axios
        .get("https://api.spotify.com/v1/me/player/recently-played?limit=6", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setRecent(res.data.items));

      // Fetch Top Artists
      axios
        .get("https://api.spotify.com/v1/me/top/artists?limit=8", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setTopArtists(res.data.items));
    }
  }, [session]);

  if (!session)
    return (
      <div className="text-center mt-20 text-zinc-500">
        Please login from sidebar.
      </div>
    );

  return (
    <div className="space-y-10">
      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-[#39C5BB]/20 to-transparent p-8 rounded-2xl border border-[#39C5BB]/10">
        <h1 className="text-4xl font-bold mb-2">
          Good Evening,{" "}
          <span className="text-[#39C5BB]">{session.user?.name}</span>
        </h1>
        <p className="text-zinc-400">
          Welcome back to your personalized lossless library.
        </p>
      </div>

      {/* Recently Played */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-[#E13875] rounded-full"></span>
          Recently Played
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recent.map((item, idx) => (
            <div
              key={idx + item.played_at}
              className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition group cursor-pointer"
              onClick={() => playTrack(item.track)}
            >
              <div className="relative mb-3">
                <img
                  src={item.track.album.images[0].url}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                  <span className="bg-[#39C5BB] text-black p-3 rounded-full">
                    ▶
                  </span>
                </div>
              </div>
              <p className="font-bold text-sm truncate">{item.track.name}</p>
              <p className="text-xs text-zinc-400 truncate">
                {item.track.artists[0].name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-[#39C5BB] rounded-full"></span>
          Your Top Artists
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {topArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="group"
            >
              <div className="bg-zinc-900/30 p-3 rounded-xl border border-transparent hover:border-[#39C5BB]/50 transition text-center">
                <img
                  src={artist.images[0]?.url}
                  className="w-24 h-24 mx-auto rounded-full object-cover mb-3 shadow-lg group-hover:scale-105 transition"
                />
                <p className="text-sm font-bold truncate">{artist.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
