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
    setStatus('Connecting via HTMLDriven Proxy...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // --- MENGGUNAKAN PROXY HTMLDRIVEN ---
      const PROXY = "https://cors-proxy.htmldriven.com/?url=";
      
      // 1. Search
      setStatus(`Mencari: ${track.name}...`);
      
      // URL Target Asli
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      // Gabungkan: Proxy + Encode(Target)
      // Kita harus encode target agar karakter '&' dan '?' tidak membingungkan server proxy
      const finalSearchUrl = PROXY + encodeURIComponent(searchTarget);
      
      const searchRes = await fetch(finalSearchUrl);
      
      // Cek apakah proxy berhasil merespon
      if (!searchRes.ok) {
        // Coba baca error body jika ada (untuk debugging di console)
        const errText = await searchRes.text();
        console.error("Proxy Search Error Body:", errText);
        throw new Error(`Proxy Error: ${searchRes.status}`);
      }
      
      // HTMLDriven biasanya mengembalikan body langsung sebagai JSON
      const searchData = await searchRes.json();
      
      // Validasi struktur data dari Dabmusic
      // Kadang proxy mengembalikan wrapper { body: "..." }, kita cek dulu
      const actualData = searchData.body ? JSON.parse(searchData.body) : searchData; 
      
      const foundTrack = actualData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. Stream
      setStatus('Mengambil stream audio...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      const finalStreamUrl = PROXY + encodeURIComponent(streamTarget);
      
      const streamRes = await fetch(finalStreamUrl);
      
      if (!streamRes.ok) throw new Error("Proxy Stream Error");

      const streamRaw = await streamRes.json();
      const streamData = streamRaw.body ? JSON.parse(streamRaw.body) : streamRaw;
      
      if (streamData.url) {
        setStreamUrl(streamData.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: Server tidak memberikan URL.');
      }

    } catch (error: any) {
      console.error("Fetch Error:", error);
      setStatus('Gagal memuat. Cek koneksi atau coba lagi.');
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