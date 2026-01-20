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
    setStatus('Menghubungkan ke Worker...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // URL Worker Anda
      const WORKER_URL = "https://moosic.jayaprat7.workers.dev/?url=";
      
      // 1. SEARCH
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Fetch ke Worker
      const searchRes = await fetch(WORKER_URL + encodeURIComponent(searchTarget));
      const searchText = await searchRes.text(); // Ambil text dulu buat ngecek error HTML

      // Cek apakah kena blokir Cloudflare (biasanya balikan HTML)
      if (searchText.includes("<!DOCTYPE html>") || searchText.includes("Just a moment")) {
        throw new Error("Worker terblokir oleh Cloudflare Dabmusic.");
      }

      const searchData = JSON.parse(searchText);
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. STREAM
      setStatus('Mengambil stream...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamRes = await fetch(WORKER_URL + encodeURIComponent(streamTarget));
      const streamText = await streamRes.text();
      
      const streamData = JSON.parse(streamText);
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: URL Stream kosong.');
      }

    } catch (error: any) {
      console.error("Player Error:", error);
      setStatus(`Gagal: ${error.message || "Network Error"}`);
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