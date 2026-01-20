'use client';

import { useState, Suspense } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { usePlayer } from '../context/PlayerContext';
import Link from 'next/link';

// WAJIB: Mencegah error build "Invalid URL"
export const dynamic = 'force-dynamic';

// 1. Komponen Utama (Isi Logic Search)
function SearchContent() {
    const { data: session } = useSession();
    const { playTrack } = usePlayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validasi input dan session
        if(!query.trim()) return;
        if(!(session as any)?.accessToken) {
            alert("Please login first to search Spotify.");
            return;
        }
        
        setIsSearching(true);
        try {
            // Request ke API internal kita (yang nembak ke Spotify)
            const res = await axios.get(`/api/search?q=${query}`, {
                headers: { Authorization: `Bearer ${(session as any).accessToken}` }
            });
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div>
            {/* Input Form */}
            <div className="mb-8">
                <form onSubmit={handleSearch}>
                    <input 
                        className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-full text-xl text-white focus:border-[#39C5BB] focus:ring-1 focus:ring-[#39C5BB] outline-none transition placeholder-zinc-500"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </form>
            </div>

            {isSearching && <div className="text-center text-[#39C5BB] animate-pulse">Searching Spotify...</div>}

            {/* Hasil Search */}
            {results && (
                <div className="space-y-12">
                    
                    {/* 1. ARTISTS SECTION */}
                    {results.artists?.items?.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold mb-4 text-white">Artists</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {results.artists.items.slice(0, 5).map((artist: any) => (
                                    <Link key={artist.id} href={`/artist/${artist.id}`}>
                                        <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer text-center group border border-transparent hover:border-[#39C5BB]/30">
                                            <img 
                                                src={artist.images[0]?.url || 'https://via.placeholder.com/150'} 
                                                className="w-full aspect-square rounded-full object-cover mb-3 shadow-lg group-hover:scale-105 transition" 
                                                alt={artist.name}
                                                referrerPolicy="no-referrer"
                                            />
                                            <p className="font-bold text-white group-hover:text-[#39C5BB] truncate">{artist.name}</p>
                                            <p className="text-xs text-zinc-400">Artist</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 2. ALBUMS SECTION */}
                    {results.albums?.items?.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold mb-4 text-white">Albums</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {results.albums.items.slice(0, 5).map((album: any) => (
                                    <Link key={album.id} href={`/album/${album.id}`}>
                                        <div className="bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition cursor-pointer group border border-transparent hover:border-[#39C5BB]/30">
                                            <img 
                                                src={album.images[0]?.url || 'https://via.placeholder.com/150'} 
                                                className="w-full aspect-square rounded-md mb-3 shadow-md object-cover" 
                                                alt={album.name}
                                                referrerPolicy="no-referrer"
                                            />
                                            <p className="font-bold text-white truncate group-hover:text-[#39C5BB]">{album.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {album.artists[0].name} • {album.release_date?.split('-')[0]}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 3. SONGS SECTION */}
                    {results.tracks?.items?.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold mb-4 text-white">Songs</h3>
                            <div className="bg-[#18181b] rounded-xl overflow-hidden border border-zinc-800">
                                {results.tracks.items.map((track: any, i: number) => (
                                    <div 
                                        key={track.id} 
                                        className="flex items-center p-3 hover:bg-[#39C5BB]/10 cursor-pointer group border-b border-zinc-800/50 last:border-0 transition"
                                        onClick={() => playTrack(track)}
                                    >
                                        <span className="w-8 text-center text-zinc-500 font-mono text-sm">{i+1}</span>
                                        <img 
                                            src={track.album.images[2]?.url || 'https://via.placeholder.com/50'} 
                                            className="w-10 h-10 rounded mr-4 object-cover shadow-sm" 
                                            alt={track.name}
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white group-hover:text-[#39C5BB] truncate">{track.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">{track.artists[0].name}</p>
                                        </div>
                                        <div className="text-sm text-zinc-500 font-mono pl-4 hidden sm:block">
                                            {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

// 2. Export Default (Wrapper Suspense)
// Ini adalah kunci agar deploy Netlify tidak error "Invalid URL"
export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-zinc-500">Loading Search Interface...</div>}>
            <SearchContent />
        </Suspense>
    );
}