export type Role = 'INTERN' | 'JUNIOR' | 'SENIOR';
export type GameType = 'BUG_HUNT' | 'EMAIL_CHAOS';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  role: Role;
  xp: number;
  level: number;
  reputation: number;
  productivity: number;
  creativity: number;
  companyId: string | null;
}

export interface Company {
  id: string;
  name: string;
  slogan: string;
  _count?: { players: number };
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
}

export interface OnlinePlayer {
  userId: string;
  username: string;
  avatar: string;
  level: number;
}

export interface GameResult {
  userId: string;
  username: string;
  score: number;
  rank: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  role: Role;
  xp: number;
  level: number;
  reputation: number;
}
