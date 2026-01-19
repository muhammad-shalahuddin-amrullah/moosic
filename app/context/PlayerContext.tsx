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
    setStatus('Menghubungkan ke server...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // --- SOLUSI: PROXY CODETABS ---
      // Proxy ini mengubah request browser menjadi request server-side di sistem mereka
      // sehingga mem-bypass CORS dan IP Block sekaligus.
      const PROXY = "https://corsproxy.io/?url=";
      
      // 1. Search
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      const searchRes = await fetch(PROXY + encodeURIComponent(searchTarget));
      
      if (!searchRes.ok) throw new Error("Proxy Search Gagal");
      
      const searchData = await searchRes.json();
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. Stream
      setStatus('Mengambil audio...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamRes = await fetch(PROXY + encodeURIComponent(streamTarget));
      
      if (!streamRes.ok) throw new Error("Proxy Stream Gagal");

      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: Server tidak memberikan URL.');
      }

    } catch (error: any) {
      console.error("Fetch Error:", error);
      setStatus('Gagal memuat. Server sibuk/memblokir akses.');
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