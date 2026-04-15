'use client';
import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from './Avatar';
import type { LeaderboardEntry } from '../../../shared/types';

const ROLE_BADGE: Record<string, string> = {
  INTERN: 'bg-slate-600 text-slate-200',
  JUNIOR: 'bg-blue-600/30 text-blue-400',
  SENIOR: 'bg-purple-600/30 text-purple-400',
};

export default function Leaderboard({ onViewProfile }: { onViewProfile: (userId: string) => void }) {
  const { leaderboard, setLeaderboard } = useGameStore();
  const { user } = useAuthStore();

  const handleLeaderboard = useCallback(
    (entries: LeaderboardEntry[]) => setLeaderboard(entries),
    [setLeaderboard]
  );

  useEffect(() => {
    const socket = getSocket();
    socket.on('leaderboard:update', handleLeaderboard);
    socket.emit('leaderboard:request');
    return () => { socket.off('leaderboard:update', handleLeaderboard); };
  }, [handleLeaderboard]);

  const rankIcon = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
      <div className="px-4 py-3 border-b border-dark-600 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <h2 className="font-bold text-white text-sm">Leaderboard</h2>
      </div>
      <div className="divide-y divide-dark-700">
        {leaderboard.length === 0 && (
          <p className="text-center text-slate-600 text-sm py-6">No players yet.</p>
        )}
        {leaderboard.map((entry, i) => (
          <button
            key={entry.id}
            onClick={() => onViewProfile(entry.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left ${
              entry.id === user?.id ? 'bg-green-500/5 border-l-2 border-green-500' : ''
            }`}
          >
            <span className="w-8 text-sm font-bold text-slate-500 text-center">
              {rankIcon(i)}
            </span>
            <Avatar avatar={entry.avatar} username={entry.username} size="sm" showLevel level={entry.level} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{entry.username}</p>
              <p className="text-xs text-slate-500">{entry.xp.toLocaleString()} XP</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[entry.role] ?? ROLE_BADGE.INTERN}`}>
              {entry.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
