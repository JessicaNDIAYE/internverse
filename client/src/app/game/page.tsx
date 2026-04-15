'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import Chat from '@/components/Chat';
import Leaderboard from '@/components/Leaderboard';
import PlayerProfileModal from '@/components/PlayerProfileModal';
import Avatar from '@/components/Avatar';
import XPBar from '@/components/XPBar';
import LevelUpToast from '@/components/LevelUpToast';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { User } from '../../../../shared/types';

export default function GameHub() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [levelUpNotif, setLevelUpNotif] = useState<number | null>(null);

  // Redirect if no company
  useEffect(() => {
    if (user && !user.companyId) router.replace('/game/companies');
  }, [user, router]);

  // Refresh user stats after games
  useEffect(() => {
    const socket = getSocket();
    function onGameResults() {
      api.get<User>('/auth/me').then((fresh) => {
        if (fresh.level > (user?.level ?? 1)) setLevelUpNotif(fresh.level);
        updateUser(fresh);
      }).catch(console.error);
    }
    socket.on('game:results', onGameResults);
    return () => { socket.off('game:results', onGameResults); };
  }, [user, updateUser]);

  if (!user?.companyId) return null;

  return (
    <>
      {levelUpNotif && (
        <LevelUpToast level={levelUpNotif} onClose={() => setLevelUpNotif(null)} />
      )}
      {profileUserId && (
        <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-dark-800 to-dark-700 border border-dark-600 flex items-center gap-4">
          <Avatar avatar={user.avatar} username={user.username} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">
              Welcome back, <span className="text-green-400">{user.username}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Level {user.level} · {user.xp.toLocaleString()} XP</p>
            <div className="mt-2 max-w-xs">
              <XPBar xp={user.xp} level={user.level} />
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Rep:</span>
              <span className="text-yellow-400 font-bold">{user.reputation}</span>
            </div>
            <Link
              href="/game/companies"
              className="text-xs text-slate-500 hover:text-green-400 transition-colors"
            >
              Switch company →
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Games */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎮</span> Mini-Games
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bug Hunt */}
              <Link href="/game/play/bug-hunt" className="block">
                <div className="p-5 rounded-2xl bg-dark-800 border-2 border-dark-600 hover:border-green-500 game-card group transition-all duration-200 hover:glow-green">
                  <div className="text-4xl mb-3 group-hover:animate-bounce">🐛</div>
                  <h3 className="text-lg font-bold text-white mb-1">Bug Hunt</h3>
                  <p className="text-slate-500 text-sm mb-3">
                    Spot the bugs in a code snippet. Speed + accuracy = XP.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                      ⚡ 60 seconds
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-dark-700 text-slate-400">
                      +50–200 XP
                    </span>
                  </div>
                </div>
              </Link>

              {/* Email Chaos */}
              <Link href="/game/play/email-chaos" className="block">
                <div className="p-5 rounded-2xl bg-dark-800 border-2 border-dark-600 hover:border-cyan-500 game-card group transition-all duration-200 hover:glow-blue">
                  <div className="text-4xl mb-3 group-hover:animate-bounce">📧</div>
                  <h3 className="text-lg font-bold text-white mb-1">Email Chaos</h3>
                  <p className="text-slate-500 text-sm mb-3">
                    Sort incoming emails before your inbox explodes.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      ⚡ 60 seconds
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-dark-700 text-slate-400">
                      +50–200 XP
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Productivity', value: user.productivity, icon: '⚙️', color: 'text-blue-400' },
                { label: 'Creativity', value: user.creativity, icon: '✨', color: 'text-pink-400' },
                { label: 'Reputation', value: user.reputation, icon: '⭐', color: 'text-yellow-400' },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl bg-dark-800 border border-dark-600 text-center">
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Leaderboard (desktop) */}
            <div className="lg:hidden">
              <Leaderboard onViewProfile={setProfileUserId} />
            </div>
          </div>

          {/* Chat + Leaderboard sidebar */}
          <div className="space-y-4 flex flex-col">
            <div className="flex-1 min-h-0 h-[400px] lg:h-[500px]">
              <Chat />
            </div>
            <div className="hidden lg:block">
              <Leaderboard onViewProfile={setProfileUserId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
