import { create } from 'zustand';
import type { GameResult, LeaderboardEntry } from '../../../shared/types';

interface GameState {
  leaderboard: LeaderboardEntry[];
  lastGameResults: GameResult[] | null;
  activeRoomId: string | null;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setLastGameResults: (results: GameResult[]) => void;
  setActiveRoom: (roomId: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  leaderboard: [],
  lastGameResults: null,
  activeRoomId: null,
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setLastGameResults: (lastGameResults) => set({ lastGameResults }),
  setActiveRoom: (activeRoomId) => set({ activeRoomId }),
}));
