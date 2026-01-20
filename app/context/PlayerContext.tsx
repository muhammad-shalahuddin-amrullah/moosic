'use client';

import React, { createContext, useContext, useState } from 'react';

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
  const [streamUrl, setStreamUrl] = useState('');
  const [status, setStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setStreamUrl(''); 
    setStatus('Menghubungkan ke Cloudflare Worker...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // --- GUNAKAN WORKER PRIBADI ANDA ---
      // Ini adalah solusi paling stabil & anti-blokir
      const WORKER_URL = "https://moosic.jayaprat7.workers.dev/?url=";
      
      // 1. SEARCH
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Browser -> Worker Anda -> Dabmusic
      const searchRes = await fetch(WORKER_URL + encodeURIComponent(searchTarget));
      
      if (!searchRes.ok) throw new Error("Gagal menghubungi Worker (Search)");
      
      const searchData = await searchRes.json();
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. STREAM
      setStatus('Mengambil stream...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamRes = await fetch(WORKER_URL + encodeURIComponent(streamTarget));
      
      if (!streamRes.ok) throw new Error("Gagal menghubungi Worker (Stream)");

      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: URL Stream kosong.');
      }

    } catch (error: any) {
      console.error("Playback Error:", error);
      setStatus('Gagal memuat lagu.');
    }
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, streamUrl, isPlaying, status, playTrack }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
