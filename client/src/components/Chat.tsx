'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from './Avatar';
import type { ChatMessage, OnlinePlayer } from '../../../shared/types';

export default function Chat() {
  const [input, setInput] = useState('');
  const [showOnline, setShowOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, onlinePlayers, addMessage, setOnlinePlayers } = useChatStore();
  const { user } = useAuthStore();

  const handleChatMessage = useCallback((msg: ChatMessage) => addMessage(msg), [addMessage]);
  const handleOnlineList = useCallback((players: OnlinePlayer[]) => setOnlinePlayers(players), [setOnlinePlayers]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('chat:message', handleChatMessage);
    socket.on('online:list', handleOnlineList);
    socket.emit('leaderboard:request');
    return () => {
      socket.off('chat:message', handleChatMessage);
      socket.off('online:list', handleOnlineList);
    };
  }, [handleChatMessage, handleOnlineList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    getSocket().emit('chat:message', { message: msg });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600">
        <h2 className="font-bold text-white text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Company Chat
        </h2>
        <button
          onClick={() => setShowOnline(!showOnline)}
          className="text-xs text-slate-400 hover:text-green-400 transition-colors flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {onlinePlayers.length} online
        </button>
      </div>

      {/* Online players panel */}
      {showOnline && (
        <div className="border-b border-dark-600 p-3 bg-dark-700">
          <p className="text-xs text-slate-500 mb-2 font-medium">Online Now</p>
          <div className="flex flex-wrap gap-2">
            {onlinePlayers.map((p) => (
              <div key={p.userId} className="flex items-center gap-1.5 text-xs text-slate-300">
                <Avatar avatar={p.avatar} username={p.username} size="sm" />
                <span>{p.username}</span>
                <span className="text-slate-600">Lv.{p.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-8">
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 animate-slide-in ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}
          >
            <Avatar avatar={msg.avatar} username={msg.username} size="sm" />
            <div className={`max-w-[75%] ${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.username}</span>
              <div
                className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.userId === user?.id
                    ? 'bg-green-500/20 border border-green-500/30 text-green-100'
                    : 'bg-dark-700 border border-dark-500 text-slate-200'
                }`}
              >
                {msg.message}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-dark-600 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={300}
          className="flex-1 px-3 py-2 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          →
        </button>
      </form>
    </div>
  );
}
