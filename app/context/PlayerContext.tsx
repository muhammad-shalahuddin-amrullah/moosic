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
    setStatus('Menghubungkan via AllOrigins...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // KITA GUNAKAN ALLORIGINS (RAW MODE)
      // Proxy ini sangat simpel: dia mengambil URL target dan memberikannya ke kita tanpa CORS.
      const PROXY_BASE = "https://api.allorigins.win/raw?url=";
      
      // 1. Search
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Tambahkan timestamp agar tidak di-cache oleh proxy
      const searchUrl = PROXY_BASE + encodeURIComponent(searchTarget) + "&t=" + Date.now();
      
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error("Search Gagal (Proxy Error)");
      
      const searchData = await searchRes.json();
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. Stream
      setStatus('Mengambil stream audio...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      // Tambahkan timestamp lagi
      const streamUrlWithProxy = PROXY_BASE + encodeURIComponent(streamTarget) + "&t=" + Date.now();
      
      const streamRes = await fetch(streamUrlWithProxy);
      if (!streamRes.ok) throw new Error("Stream Gagal (Proxy Error)");

      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: Server tidak memberikan URL.');
      }

    } catch (error: any) {
      console.error("Proxy Error:", error);
      setStatus('Gagal memuat. Silakan coba lagi nanti.');
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