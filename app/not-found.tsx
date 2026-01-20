import Link from 'next/link';

export const dynamic = 'force-dynamic'; // <--- WAJIB

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white">
      <h2 className="text-4xl font-bold mb-4 text-[#E13875]">404 Not Found</h2>
      <p className="mb-8 text-zinc-400">Could not find requested resource</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-[#39C5BB] text-black font-bold rounded-full hover:scale-105 transition"
      >
        Return Home
      </Link>
    </div>
  );
}