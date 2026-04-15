'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '../../../../../shared/types';

const AVATARS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '', avatar: 'A' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/signup', form);
      setAuth(data.user, data.token);
      router.replace('/game/companies');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-black font-bold text-sm">IV</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">InternVerse</span>
          </Link>
          <p className="text-slate-400 mt-2">Create your intern account.</p>
        </div>

        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-600">
          <h1 className="text-2xl font-bold text-white mb-6">Sign Up</h1>

          {/* Avatar picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2">Choose Avatar</label>
            <div className="flex gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm({ ...form, avatar: a })}
                  className={`w-10 h-10 rounded-xl avatar-${a} flex items-center justify-center text-white font-bold text-sm transition-all duration-150 ${
                    form.avatar === a ? 'ring-2 ring-green-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="CoolIntern99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold text-base hover:from-green-400 hover:to-cyan-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Start Your Internship →'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
