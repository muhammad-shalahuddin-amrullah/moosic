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
    setStatus('Mencari sumber audio...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // KITA GUNAKAN CORS PROXY AGAR BISA AKSES DARI BROWSER LANGSUNG
      // Proxy ini membungkus request kita agar lolos dari aturan browser
      const CORS_PROXY = "https://corsproxy.io/?";
      
      // 1. Search ke Dabmusic via Proxy
      setStatus(`Mencari: ${query}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      const searchRes = await fetch(CORS_PROXY + encodeURIComponent(searchTarget));
      const searchData = await searchRes.json();
      
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan di database.');
        return;
      }

      // 2. Get Stream URL via Proxy
      setStatus('Mengambil audio stream...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamRes = await fetch(CORS_PROXY + encodeURIComponent(streamTarget));
      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: URL Stream kosong.');
      }

    } catch (error: any) {
      console.error("Client Fetch Error:", error);
      setStatus('Gagal memuat lagu (Network Error).');
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
