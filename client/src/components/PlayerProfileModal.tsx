'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Avatar from './Avatar';
import XPBar from './XPBar';

interface PlayerProfile {
  id: string;
  username: string;
  avatar: string;
  role: string;
  xp: number;
  level: number;
  reputation: number;
  productivity: number;
  creativity: number;
  company?: { name: string } | null;
  gameResults?: { gameType: string; score: number; xpEarned: number; createdAt: string }[];
  createdAt: string;
}

interface Props {
  userId: string;
  onClose: () => void;
}

export default function PlayerProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PlayerProfile>(`/users/${userId}`)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const stats = profile
    ? [
        { label: 'XP', value: profile.xp.toLocaleString(), color: 'text-green-400' },
        { label: 'Reputation', value: profile.reputation, color: 'text-yellow-400' },
        { label: 'Productivity', value: profile.productivity, color: 'text-blue-400' },
        { label: 'Creativity', value: profile.creativity, color: 'text-pink-400' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-dark-700 to-dark-800">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <Avatar avatar={profile.avatar} username={profile.username} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-white">{profile.username}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400">
                      {profile.company?.name ?? 'No company'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-slate-300">
                      {profile.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-green-400">Lv. {profile.level}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <XPBar xp={profile.xp} level={profile.level} />
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-dark-700 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent games */}
            {profile.gameResults && profile.gameResults.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Recent Games</p>
                <div className="space-y-2">
                  {profile.gameResults.slice(0, 5).map((g, i) => (
                    <div key={i} className="flex items-center justify-between bg-dark-700 rounded-xl px-3 py-2">
                      <span className="text-sm text-slate-300">
                        {g.gameType === 'BUG_HUNT' ? '🐛 Bug Hunt' : '📧 Email Chaos'}
                      </span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-white font-semibold">{g.score} pts</span>
                        <span className="text-green-400">+{g.xpEarned} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">Player not found</div>
        )}
      </div>
    </div>
  );
}
