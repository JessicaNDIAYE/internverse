'use client';
import { useEffect } from 'react';

interface LevelUpToastProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpToast({ level, onClose }: LevelUpToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 notification">
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 backdrop-blur-sm shadow-2xl">
        <span className="text-3xl animate-bounce">🎉</span>
        <div>
          <p className="text-yellow-400 font-bold text-lg">LEVEL UP!</p>
          <p className="text-slate-300 text-sm">You reached Level {level}!</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white ml-2">✕</button>
      </div>
    </div>
  );
}
