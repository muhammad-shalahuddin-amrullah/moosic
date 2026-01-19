"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import Link from "next/link";

export default function LibraryPage() {
  const { data: session } = useSession();
  const { playTrack } = usePlayer();

  // State Data
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]); // <--- State Baru

  // State Tab
  const [activeTab, setActiveTab] = useState<"tracks" | "albums" | "playlists">(
    "playlists"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((session as any)?.accessToken) {
      setLoading(true);
      const token = (session as any).accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Liked Songs
      axios
        .get("https://api.spotify.com/v1/me/tracks?limit=20", { headers })
        .then((r) => setLikedTracks(r.data.items));

      // 2. Saved Albums
      axios
        .get("https://api.spotify.com/v1/me/albums?limit=20", { headers })
        .then((r) => setSavedAlbums(r.data.items));

      // 3. User Playlists (Termasuk Radio yang disimpan)
      axios
        .get("https://api.spotify.com/v1/me/playlists?limit=20", { headers })
        .then((r) => setPlaylists(r.data.items))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (!session)
    return <div className="p-10 text-zinc-500">Please login first.</div>;

  const TabButton = ({ name, id }: { name: string; id: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-2 rounded-full font-bold transition text-sm md:text-base ${
        activeTab === id
          ? "bg-[#39C5BB] text-black shadow-[0_0_10px_#39C5BB]"
          : "bg-zinc-900 text-zinc-400 hover:text-white"
      }`}
    >
      {name}
    </button>
  );

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Your Library</h1>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-zinc-800 pb-4">
        <TabButton name="Playlists" id="playlists" />
        <TabButton name="Liked Songs" id="tracks" />
        <TabButton name="Albums" id="albums" />
      </div>

      {loading && (
        <p className="text-zinc-500 animate-pulse">Syncing Library...</p>
      )}

      {/* --- TAB PLAYLISTS --- */}
      {activeTab === "playlists" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {playlists.length === 0 && !loading && (
            <div className="text-zinc-500">No playlists found.</div>
          )}

          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
              <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer group border border-zinc-800 hover:border-[#39C5BB]/50 h-full flex flex-col">
                <div className="relative mb-3">
                  <img
                    src={
                      playlist.images?.[0]?.url ||
                      "https://via.placeholder.com/150"
                    }
                    className="w-full aspect-square rounded-md object-cover shadow-lg"
                    alt="cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-md">
                    <span className="text-[#39C5BB] font-bold tracking-widest">
                      OPEN
                    </span>
                  </div>
                </div>
                <p className="font-bold truncate text-white group-hover:text-[#39C5BB]">
                  {playlist.name}
                </p>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {playlist.description || `By ${playlist.owner.display_name}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- TAB ALBUMS --- */}
      {activeTab === "albums" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {savedAlbums.map((item) => (
            <Link key={item.album.id} href={`/album/${item.album.id}`}>
              <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer group border border-zinc-800 hover:border-[#39C5BB]/50">
                <img
                  src={item.album.images[0]?.url}
                  className="w-full aspect-square rounded-md object-cover mb-3 shadow-lg"
                  alt="album"
                  referrerPolicy="no-referrer"
                />
                <p className="font-bold truncate text-white group-hover:text-[#39C5BB]">
                  {item.album.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {item.album.artists[0].name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- TAB SONGS --- */}
      {activeTab === "tracks" && (
        <div className="bg-[#18181b] rounded-xl overflow-hidden border border-zinc-800">
          {likedTracks.map((item, i) => (
            <div
              key={item.track.id + i}
              className="flex items-center p-3 hover:bg-[#39C5BB]/10 cursor-pointer border-b border-zinc-800 last:border-0 group"
              onClick={() => playTrack(item.track)}
            >
              <span className="w-8 text-center text-zinc-500 font-mono text-sm">
                {i + 1}
              </span>
              <img
                src={item.track.album.images[2]?.url}
                className="w-10 h-10 rounded mr-4 object-cover"
                alt="art"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white group-hover:text-[#39C5BB] truncate">
                  {item.track.name}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {item.track.artists[0].name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
