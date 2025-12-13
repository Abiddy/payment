'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#18181b] border-b border-[#3a3a3d] h-14 flex items-center px-4">
      <div className="flex items-center gap-6 w-full">
        {/* Left side - Browse */}
        <Link
          href="/"
          className={`px-4 py-2 rounded font-medium transition-colors ${
            pathname === '/'
              ? 'text-white bg-green-600 hover:bg-green-700'
              : 'text-[#efeff1] hover:text-white hover:bg-[#26262c]'
          }`}
        >
          Streamers
        </Link>

        {/* Center - Loop Logo */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="text-2xl font-bold text-white font-sekuya tracking-tight">
            LOOP
          </Link>
        </div>

        {/* Right side - Dashboard */}
        <Link
          href="/dashboard"
          className={`px-4 py-2 rounded font-medium transition-colors ${
            pathname === '/dashboard'
              ? 'text-white bg-green-600 hover:bg-green-700'
              : 'text-[#efeff1] hover:text-white hover:bg-[#26262c]'
          }`}
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

