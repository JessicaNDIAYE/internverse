'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LandingPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/game');
  }, [user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-dark-900">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-green-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center px-4 max-w-4xl">
        {/* Logo */}
        <div className="mb-6 animate-bounce-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-2xl font-bold text-black shadow-lg glow-green">
              IV
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="text-white">Intern</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 text-glow-green">
              Verse
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mt-4 font-medium">
            The Corporate Survival Game
          </p>
        </div>

        {/* Taglines */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm font-semibold">
          {['⚡ Real-time battles', '💬 Live company chat', '🎮 Fast mini-games', '🏆 Climb the ranks'].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-dark-700 border border-dark-500 text-slate-300">
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold text-lg hover:from-green-400 hover:to-cyan-400 transition-all duration-200 shadow-lg glow-green hover:scale-105 active:scale-95"
          >
            Start Your Internship →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl border-2 border-dark-500 text-slate-300 font-bold text-lg hover:border-green-500 hover:text-green-400 transition-all duration-200"
          >
            Login
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '🏢',
              title: 'Join a Company',
              desc: 'Pick your corp and represent it in every battle. Climb the internal ranks.',
            },
            {
              icon: '🎮',
              title: 'Play Mini-Games',
              desc: 'Bug Hunt & Email Chaos. 60 seconds of pure chaos to earn XP.',
            },
            {
              icon: '🏆',
              title: 'Dominate the Board',
              desc: 'Real-time leaderboard. Every game counts. No mercy.',
            },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-2xl bg-dark-800 border border-dark-600 game-card">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
