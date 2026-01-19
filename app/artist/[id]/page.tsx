"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useParams } from "next/navigation";
import { usePlayer } from "../../context/PlayerContext";
import Link from "next/link";

export default function ArtistPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const { playTrack } = usePlayer();

  const [artist, setArtist] = useState<any>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    if ((session as any)?.accessToken && id) {
      const token = (session as any).accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get Artist Info
      axios
        .get(`https://api.spotify.com/v1/artists/${id}`, { headers })
        .then((r) => setArtist(r.data));
      // 2. Get Top Tracks
      axios
        .get(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=ID`, {
          headers,
        })
        .then((r) => setTopTracks(r.data.tracks));
      // 3. Get Albums
      axios
        .get(
          `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=10`,
          { headers }
        )
        .then((r) => setAlbums(r.data.items));
    }
  }, [session, id]);

  if (!artist)
    return <div className="p-10 text-center">Loading Artist Data...</div>;

  return (
    <div>
      {/* Header Banner */}
      <div className="flex items-end gap-6 mb-8 bg-gradient-to-b from-zinc-800 to-[#121212] p-8 rounded-3xl">
        <img
          src={artist.images[0]?.url}
          className="w-52 h-52 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] object-cover"
        />
        <div>
          <h1 className="text-6xl font-black text-white mb-4">{artist.name}</h1>
          <p className="text-zinc-400 text-lg">
            {artist.followers.total.toLocaleString()} Followers
          </p>
          <div className="mt-4 flex gap-2">
            {artist.genres.map((g: string) => (
              <span
                key={g}
                className="px-3 py-1 bg-[#39C5BB] text-black text-xs font-bold rounded-full uppercase tracking-wider"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Songs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-[#E13875]">
            Popular Songs
          </h2>
          <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-zinc-800">
            {topTracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center p-3 hover:bg-white/5 cursor-pointer border-b border-zinc-800/50 last:border-0 group"
                onClick={() => playTrack(track)}
              >
                <div className="w-8 text-center text-zinc-500 group-hover:text-[#39C5BB] font-bold">
                  {i + 1}
                </div>
                <img
                  src={track.album.images[2].url}
                  className="w-12 h-12 rounded mx-4"
                />
                <div className="flex-1">
                  <p className="font-bold group-hover:text-[#39C5BB] transition">
                    {track.name}
                  </p>
                  <p className="text-xs text-zinc-500">{track.album.name}</p>
                </div>
                <div className="text-sm text-zinc-500 pr-4">
                  {Math.floor(track.duration_ms / 60000)}:
                  {((track.duration_ms % 60000) / 1000)
                    .toFixed(0)
                    .padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discography / Albums */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Discography</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {albums.map((album) => (
              <Link key={album.id} href={`/album/${album.id}`}>
                <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 cursor-pointer border border-zinc-800 hover:border-[#39C5BB]/50 transition">
                  <img
                    src={album.images[2]?.url}
                    className="w-16 h-16 rounded"
                  />
                  <div>
                    <p className="font-bold text-sm">{album.name}</p>
                    <p className="text-xs text-zinc-500">
                      {album.release_date.split("-")[0]} • {album.type}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
