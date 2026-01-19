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
      
      // --- DIRECT FETCH (Tanpa Proxy) ---
      
      // 1. Search
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Kita kirim request polosan (biarkan browser handle headers)
      const searchRes = await fetch(searchTarget);
      
      if (!searchRes.ok) {
        throw new Error(`Gagal Search: ${searchRes.statusText}`);
      }
      
      const searchData = await searchRes.json();
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. Get Stream
      setStatus('Mengambil audio...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamRes = await fetch(streamTarget);
      
      if (!streamRes.ok) {
        throw new Error(`Gagal Stream: ${streamRes.statusText}`);
      }

      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: Server tidak memberikan URL.');
      }

    } catch (error: any) {
      console.error("Direct Fetch Error:", error);
      // Pesan error user-friendly
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        setStatus('Gagal: Diblokir oleh browser (CORS).');
      } else {
        setStatus(`Error: ${error.message}`);
      }
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