'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Avatar from '@/components/Avatar';
import XPBar from '@/components/XPBar';

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

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get<PlayerProfile>(`/users/${id}`)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-xl">Player not found.</p>
        <button onClick={() => router.push('/game')} className="mt-4 text-green-400 hover:underline">
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <button onClick={() => router.back()} className="text-slate-500 hover:text-white transition-colors text-sm">
        ← Back
      </button>

      {/* Profile card */}
      <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-dark-700 to-dark-800">
          <div className="flex items-center gap-4">
            <Avatar avatar={profile.avatar} username={profile.username} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <p className="text-slate-400 text-sm">{profile.company?.name ?? 'No company'}</p>
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-dark-600 text-slate-300 mt-1">
                {profile.role}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <XPBar xp={profile.xp} level={profile.level} />
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { label: 'XP', value: profile.xp.toLocaleString(), color: 'text-green-400' },
            { label: 'Level', value: profile.level, color: 'text-cyan-400' },
            { label: 'Reputation', value: profile.reputation, color: 'text-yellow-400' },
            { label: 'Productivity', value: profile.productivity, color: 'text-blue-400' },
            { label: 'Creativity', value: profile.creativity, color: 'text-pink-400' },
          ].map((s) => (
            <div key={s.label} className="bg-dark-700 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent games */}
        {profile.gameResults && profile.gameResults.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Recent Games</p>
            <div className="space-y-2">
              {profile.gameResults.slice(0, 8).map((g, i) => (
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

        <div className="px-4 pb-4">
          <p className="text-xs text-slate-600">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
