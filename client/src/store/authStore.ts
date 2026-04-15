import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('iv_token', token);
        set({ user, token });
      },
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('iv_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'iv_auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
