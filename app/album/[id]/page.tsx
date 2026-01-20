"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useParams } from "next/navigation";
import { usePlayer } from "../../context/PlayerContext";
import Link from "next/link";
export const dynamic = 'force-dynamic'; // <--- TAMBAHKAN INI

export default function AlbumPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const { playTrack } = usePlayer();

  const [album, setAlbum] = useState<any>(null);

  useEffect(() => {
    if ((session as any)?.accessToken && id) {
      const token = (session as any).accessToken;
      axios
        .get(`https://api.spotify.com/v1/albums/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => setAlbum(r.data));
    }
  }, [session, id]);

  if (!album) return <div className="p-10 text-center">Loading Album...</div>;

  return (
    <div>
      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-10 p-8 bg-[#18181b] rounded-3xl border border-zinc-800">
        <img
          src={album.images[0]?.url}
          className="w-64 h-64 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        />
        <div className="flex flex-col justify-end">
          <p className="uppercase tracking-widest text-xs font-bold text-[#E13875] mb-2">
            {album.album_type}
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">{album.name}</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <img
              src={album.artists[0]?.images?.[0]?.url}
              className="w-6 h-6 rounded-full bg-zinc-700"
            />{" "}
            {/* Avatar fallback */}
            <Link
              href={`/artist/${album.artists[0].id}`}
              className="font-bold hover:underline hover:text-[#39C5BB]"
            >
              {album.artists[0].name}
            </Link>
            <span>•</span>
            <span>{album.release_date.split("-")[0]}</span>
            <span>•</span>
            <span>{album.total_tracks} songs</span>
          </div>
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="bg-[#121212] rounded-xl">
        <div className="grid grid-cols-[50px_1fr_100px] text-zinc-500 text-sm border-b border-zinc-800 pb-2 px-4 mb-2 uppercase tracking-wider">
          <span>#</span>
          <span>Title</span>
          <span className="text-right">Clock</span>
        </div>
        {album.tracks.items.map((track: any) => (
          <div
            key={track.id}
            className="grid grid-cols-[50px_1fr_100px] items-center p-3 hover:bg-zinc-900 rounded-lg cursor-pointer group transition"
            onClick={() => {
              // API album track item tidak punya full album image, kita inject manual
              const trackWithAlbum = { ...track, album: album };
              playTrack(trackWithAlbum);
            }}
          >
            <div className="text-zinc-500 group-hover:text-[#39C5BB] font-mono">
              {track.track_number}
            </div>
            <div>
              <p className="font-bold text-white group-hover:text-[#39C5BB]">
                {track.name}
              </p>
              <p className="text-xs text-zinc-500">
                {track.artists.map((a: any) => a.name).join(", ")}
              </p>
            </div>
            <div className="text-right text-sm text-zinc-500">
              {Math.floor(track.duration_ms / 60000)}:
              {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
