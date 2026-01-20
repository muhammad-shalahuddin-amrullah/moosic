"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useParams } from "next/navigation";
import { usePlayer } from "../../context/PlayerContext";
import Link from "next/link";
export const dynamic = 'force-dynamic'; // <--- TAMBAHKAN INI

export default function PlaylistPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const { playTrack } = usePlayer();

  const [playlist, setPlaylist] = useState<any>(null);

  useEffect(() => {
    if ((session as any)?.accessToken && id) {
      const token = (session as any).accessToken;
      axios
        .get(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => setPlaylist(r.data));
    }
  }, [session, id]);

  if (!playlist)
    return <div className="p-10 text-center">Loading Playlist...</div>;

  return (
    <div>
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-10 p-8 bg-gradient-to-b from-zinc-800 to-[#121212] rounded-3xl">
        <img
          src={playlist.images?.[0]?.url}
          className="w-60 h-60 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col justify-end">
          <p className="uppercase tracking-widest text-xs font-bold text-[#E13875] mb-2">
            Playlist
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-white">
            {playlist.name}
          </h1>
          <p className="text-zinc-400 mb-4 text-sm max-w-2xl line-clamp-2">
            {playlist.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-white font-bold">
            <span>{playlist.owner.display_name}</span>
            <span>•</span>
            <span>{playlist.tracks.total} songs</span>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="bg-[#121212] rounded-xl">
        <div className="grid grid-cols-[50px_1fr_100px] text-zinc-500 text-sm border-b border-zinc-800 pb-2 px-4 mb-2 uppercase tracking-wider">
          <span>#</span>
          <span>Title</span>
          <span className="text-right">Clock</span>
        </div>

        {playlist.tracks.items.map((item: any, i: number) => {
          const track = item.track;
          if (!track) return null; // Handle hidden tracks

          return (
            <div
              key={track.id + i}
              className="grid grid-cols-[50px_1fr_100px] items-center p-3 hover:bg-zinc-900 rounded-lg cursor-pointer group transition border-b border-zinc-800/50 last:border-0"
              onClick={() => playTrack(track)}
            >
              <div className="text-zinc-500 group-hover:text-[#39C5BB] font-mono">
                {i + 1}
              </div>
              <div className="flex items-center gap-4 overflow-hidden">
                <img
                  src={track.album.images[2]?.url}
                  className="w-10 h-10 rounded object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white group-hover:text-[#39C5BB] truncate">
                    {track.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {track.artists.map((a: any) => a.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                {Math.floor(track.duration_ms / 60000)}:
                {((track.duration_ms % 60000) / 1000)
                  .toFixed(0)
                  .padStart(2, "0")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
