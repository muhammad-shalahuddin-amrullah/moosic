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

  // --- LOGIKA ROTASI PROXY ---
  const fetchWithFallback = async (targetUrl: string) => {
    // Daftar Proxy (Prioritas 1 sampai 3)
    const proxies = [
      // 1. CodeTabs (Biasanya paling kuat tembus Cloudflare)
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      // 2. AllOrigins (Cadangan stabil)
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      // 3. ThingProxy (Cadangan terakhir)
      (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    ];

    let lastError;

    for (let i = 0; i < proxies.length; i++) {
      const proxyUrl = proxies[i](targetUrl);
      console.log(`Trying Proxy #${i + 1}:`, proxyUrl);
      
      try {
        const res = await fetch(proxyUrl);
        
        // Cek jika status OK
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        // Cek jika response adalah JSON (Bukan HTML Cloudflare "Just a moment...")
        const textBody = await res.text();
        if (textBody.includes('<!DOCTYPE html>') || textBody.includes('Just a moment')) {
          throw new Error("Terblokir Cloudflare (HTML Response)");
        }

        // Jika berhasil parse JSON, kembalikan data
        return JSON.parse(textBody);

      } catch (err) {
        console.warn(`Proxy #${i + 1} gagal:`, err);
        lastError = err;
        // Lanjut ke proxy berikutnya...
      }
    }
    
    // Jika semua gagal
    throw lastError;
  };

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setStreamUrl(''); 
    setStatus('Mencari jalur koneksi terbaik...');
    setIsPlaying(false);

    try {
      const query = `${track.name} ${track.artists ? track.artists[0].name : ''}`;
      
      // 1. SEARCH
      setStatus(`Mencari: ${track.name}...`);
      const searchTarget = `https://dabmusic.xyz/api/search?q=${encodeURIComponent(query)}&type=track&offset=0`;
      
      const searchData = await fetchWithFallback(searchTarget);
      
      // Handle format response yang kadang dibungkus proxy
      const actualData = searchData.contents ? JSON.parse(searchData.contents) : searchData;
      const foundTrack = actualData.tracks?.[0];

      if (!foundTrack) {
        setStatus('Lagu tidak ditemukan.');
        return;
      }

      // 2. STREAM
      setStatus('Mengambil stream audio...');
      const streamTarget = `https://dabmusic.xyz/api/stream?trackId=${foundTrack.id}`;
      
      const streamData = await fetchWithFallback(streamTarget);
      const actualStream = streamData.contents ? JSON.parse(streamData.contents) : streamData;

      if (actualStream.url) {
        setStreamUrl(actualStream.url);
        setStatus(`Playing: ${track.name}`);
        setIsPlaying(true);
      } else {
        setStatus('Gagal: URL Stream kosong.');
      }

    } catch (error: any) {
      console.error("All Proxies Failed:", error);
      setStatus('Gagal memuat. Server sedang sibuk/memblokir akses.');
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