'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import type { Company, User } from '../../../../../shared/types';

export default function CompanySelectPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const { user, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    api.get<Company[]>('/companies')
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function joinCompany(companyId: string) {
    setJoining(companyId);
    try {
      const data = await api.post<{ user: User; company: Company }>(`/companies/${companyId}/join`, {});
      updateUser({ companyId: data.user.companyId });
      // Tell socket we joined
      getSocket().emit('company:join', { companyId, level: data.user.level });
      router.replace('/game');
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(null);
    }
  }

  const ICONS = ['🏢', '🌆', '🚀', '⚡', '💡'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Company</h1>
        <p className="text-slate-400">Your company is your team. Choose wisely.</p>
        {user?.companyId && (
          <button
            onClick={() => router.replace('/game')}
            className="mt-3 text-sm text-slate-500 hover:text-green-400 transition-colors underline"
          >
            ← Back to hub
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((c, i) => (
            <div
              key={c.id}
              className={`p-5 rounded-2xl bg-dark-800 border-2 transition-all duration-150 game-card ${
                user?.companyId === c.id
                  ? 'border-green-500 glow-green'
                  : 'border-dark-600 hover:border-dark-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{ICONS[i % ICONS.length]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    {user?.companyId === c.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm italic">&ldquo;{c.slogan}&rdquo;</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {(c._count?.players ?? 0)} {(c._count?.players ?? 0) === 1 ? 'intern' : 'interns'}
                  </p>
                </div>
                <button
                  onClick={() => joinCompany(c.id)}
                  disabled={joining !== null || user?.companyId === c.id}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                    user?.companyId === c.id
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : 'bg-gradient-to-r from-green-500 to-cyan-500 text-black hover:from-green-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {joining === c.id ? (
                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : user?.companyId === c.id ? (
                    'Joined ✓'
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
