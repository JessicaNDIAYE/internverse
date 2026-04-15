import { create } from 'zustand';
import type { ChatMessage, OnlinePlayer } from '../../../shared/types';

interface ChatState {
  messages: ChatMessage[];
  onlinePlayers: OnlinePlayer[];
  addMessage: (msg: ChatMessage) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  onlinePlayers: [],
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages.slice(-199), msg],
    })),
  setOnlinePlayers: (players) => set({ onlinePlayers: players }),
  clearChat: () => set({ messages: [], onlinePlayers: [] }),
}));
