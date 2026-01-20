"use client";
import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { usePlayer } from "../context/PlayerContext";
import Link from "next/link";
export const dynamic = 'force-dynamic'; 

export default function SearchPage() {
  const { data: session } = useSession();
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query || !(session as any)?.accessToken) return;

    const res = await axios.get(`/api/search?q=${query}`, {
      headers: { Authorization: `Bearer ${(session as any).accessToken}` },
    });
    setResults(res.data);
  };

  return (
    <div>
      <div className="mb-8">
        <form onSubmit={handleSearch}>
          <input
            className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-full text-xl focus:border-[#39C5BB] focus:ring-1 focus:ring-[#39C5BB] outline-none transition"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      {results && (
        <div className="space-y-10">
          {/* Artists */}
          {results.artists?.items.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-4">Artists</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {results.artists.items.slice(0, 5).map((artist: any) => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer">
                      <img
                        src={artist.images[0]?.url}
                        className="w-full aspect-square rounded-full object-cover mb-3 shadow-md"
                      />
                      <p className="font-bold text-center">{artist.name}</p>
                      <p className="text-xs text-center text-zinc-400">
                        Artist
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {results.albums?.items.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-4">Albums</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {results.albums.items.slice(0, 5).map((album: any) => (
                  <Link key={album.id} href={`/album/${album.id}`}>
                    <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer group">
                      <img
                        src={album.images[0]?.url}
                        className="w-full rounded-md mb-3 shadow-md"
                      />
                      <p className="font-bold truncate">{album.name}</p>
                      <p className="text-xs text-zinc-400">
                        {album.artists[0].name} •{" "}
                        {album.release_date.split("-")[0]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Songs */}
          {results.tracks?.items.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-4">Songs</h3>
              <div className="bg-[#18181b] rounded-xl overflow-hidden">
                {results.tracks.items.map((track: any, i: number) => (
                  <div
                    key={track.id}
                    className="flex items-center p-3 hover:bg-[#39C5BB]/10 cursor-pointer group border-b border-zinc-800 last:border-0"
                    onClick={() => playTrack(track)}
                  >
                    <span className="w-8 text-center text-zinc-500">
                      {i + 1}
                    </span>
                    <img
                      src={track.album.images[2].url}
                      className="w-10 h-10 rounded mr-4"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white group-hover:text-[#39C5BB]">
                        {track.name}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {track.artists[0].name}
                      </p>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {Math.floor(track.duration_ms / 60000)}:
                      {((track.duration_ms % 60000) / 1000)
                        .toFixed(0)
                        .padStart(2, "0")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
