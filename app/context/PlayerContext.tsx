"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios"; // Pastikan axios terinstall

interface Track {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: { name: string; images: { url: string }[]; id: string };
  duration_ms?: number;
}

interface PlayerContextType {
  currentTrack: Track | null;
  streamUrl: string;
  isPlaying: boolean;
  status: string;
  playTrack: (track: Track) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setStreamUrl("");
    setStatus("Memproses audio di server...");
    setIsPlaying(false);

    try {
      // Logic pintar: Gabungkan Artis + Judul
      const artistName = track.artists ? track.artists[0].name : "";
      const searchQuery = `${track.name} ${artistName}`;

      // Panggil API Backend Vercel kita sendiri
      const res = await axios.get(`/api/stream?query=${searchQuery}`);

      if (res.data.url) {
        setStreamUrl(res.data.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus("Gagal: Stream tidak ditemukan");
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Gagal memuat.";
      setStatus(msg);
    }
  };

  return (
    <PlayerContext.Provider
      value={{ currentTrack, streamUrl, isPlaying, status, playTrack }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
