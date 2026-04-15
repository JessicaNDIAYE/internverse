'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import Avatar from '@/components/Avatar';
import XPBar from '@/components/XPBar';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !token) {
      router.replace('/login');
      return;
    }
    connectSocket(token);
    return () => { /* keep socket alive across game pages */ };
  }, [user, token, router]);

  function handleLogout() {
    disconnectSocket();
    logout();
    router.replace('/');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/game" className="flex items-center gap-2 font-bold text-lg flex-shrink-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-black text-xs font-bold">IV</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 hidden sm:block">InternVerse</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-2">
            <Link href="/game" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 text-sm font-medium transition-colors">
              Hub
            </Link>
            <Link href="/game/play/bug-hunt" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 text-sm font-medium transition-colors">
              🐛 Bug Hunt
            </Link>
            <Link href="/game/play/email-chaos" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 text-sm font-medium transition-colors">
              📧 Email Chaos
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-400 font-medium">{user.username}</p>
              <XPBar xp={user.xp} level={user.level} compact />
            </div>
            <Avatar avatar={user.avatar} username={user.username} size="sm" showLevel level={user.level} />
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
