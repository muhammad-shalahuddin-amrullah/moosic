'use client';

import React, { createContext, useContext, useState } from 'react';

// Tipe data Track sesuai struktur dari Spotify API
interface Track {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: { name: string; images: { url: string }[]; id: string };
  duration_ms?: number;
}

// Tipe data Context untuk state global player
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
    setStatus('Connecting to Cloudflare Worker...');
    setIsPlaying(false);

    try {
      // Gabungkan Judul + Artis untuk pencarian yang akurat
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // --- KONFIGURASI PROXY PRIBADI ANDA ---
      const PROXY_BASE = "https://moosic.jayaprat7.workers.dev/?url=";
      
      // 1. TAHAP SEARCH (Mencari ID lagu di Dabmusic)
      setStatus(`Mencari: ${track.name}...`);
      
      // URL Target Asli
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Request via Worker
      // Kita encode target URL agar aman saat dikirim ke Worker
      const searchRes = await fetch(PROXY_BASE + encodeURIComponent(searchTarget));
      
      if (!searchRes.ok) {
        throw new Error(`Worker Search Error: ${searchRes.statusText}`);
      }
      
      const searchData = await searchRes.json();
      const foundTrack = searchData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan di server lossless.');
        return;
      }

      // 2. TAHAP STREAM (Mendapatkan Link Audio)
      setStatus('Mengambil stream audio...');
      
      // Gunakan ID yang ditemukan dari tahap search
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      // Request via Worker lagi
      const streamRes = await fetch(PROXY_BASE + encodeURIComponent(streamTarget));
      
      if (!streamRes.ok) {
        throw new Error(`Worker Stream Error: ${streamRes.statusText}`);
      }

      const streamData = await streamRes.json();
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: Server tidak memberikan URL Audio.');
      }

    } catch (error: any) {
      console.error("Player Error:", error);
      setStatus('Gagal memuat. Pastikan Cloudflare Worker aktif.');
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