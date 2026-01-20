"use client";

import "./globals.css";
import { Providers } from "./providers";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
export const dynamic = 'force-dynamic'; 

// --- KOMPONEN PLAYER (STICKY BOTTOM) ---
function StickyPlayer() {
  const { currentTrack, streamUrl, status } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#121212] border-t border-[#39C5BB]/30 backdrop-blur-lg p-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center max-w-screen-2xl mx-auto">
        {/* Info Lagu Kiri */}
        <div className="flex items-center w-1/4 min-w-[200px]">
          <img
            src={
              currentTrack.album?.images[0]?.url ||
              "https://via.placeholder.com/50"
            }
            className="w-14 h-14 rounded-md shadow-[0_0_10px_#39C5BB]"
            alt="cover"
          />
          <div className="ml-3 overflow-hidden">
            <p className="text-white font-bold truncate text-sm">
              {currentTrack.name}
            </p>
            <p className="text-[#39C5BB] text-xs truncate">
              {currentTrack.artists?.[0]?.name}
            </p>
            <p className="text-[10px] text-gray-500 animate-pulse">{status}</p>
          </div>
        </div>

        {/* Audio Player Tengah/Kanan */}
        <div className="flex-1">
          <AudioPlayer
            autoPlay
            // PERBAIKAN: Gunakan 'undefined' agar TypeScript senang
            src={streamUrl || undefined}
            showJumpControls={false}
            layout="stacked-reverse"
            style={{ background: "transparent", boxShadow: "none" }}
            customAdditionalControls={[]}
          />
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN SIDEBAR ---
function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menu = [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "Library", href: "/library" },
  ];

  return (
    <aside className="w-64 fixed left-0 top-0 h-full bg-[#09090b] border-r border-zinc-800 p-6 flex flex-col z-40">
      {/* Logo Miku */}
      <h1 className="text-2xl font-bold text-[#39C5BB] mb-10 tracking-widest drop-shadow-[0_0_5px_#39C5BB]">
        MIKU<span className="text-white">MUSIC</span>
      </h1>

      {/* Navigasi */}
      <nav className="flex-1 space-y-2">
        {menu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? "bg-[#39C5BB] text-black shadow-[0_0_15px_#39C5BBaa]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info Bawah */}
      <div className="mt-auto pt-6 border-t border-zinc-800">
        {session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                className="w-8 h-8 rounded-full ring-2 ring-[#E13875]"
                alt="User"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">
                {session.user?.name}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-[#E13875] hover:underline hover:text-red-400 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn("spotify")}
            className="w-full bg-[#39C5BB] hover:bg-[#2faea5] text-black font-bold py-2 rounded-lg transition"
          >
            Login Spotify
          </button>
        )}
      </div>
    </aside>
  );
}

// --- ROOT LAYOUT UTAMA ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-white overflow-x-hidden">
        <Providers>
          <PlayerProvider>
            <div className="flex min-h-screen">
              {/* 1. Sidebar Kiri */}
              <Sidebar />

              {/* 2. Konten Utama (diberi margin kiri 64 agar tidak tertutup sidebar) */}
              <main className="flex-1 ml-64 p-8 pb-32">{children}</main>

              {/* 3. Player Bawah */}
              <StickyPlayer />
            </div>
          </PlayerProvider>
        </Providers>
      </body>
    </html>
  );
}
