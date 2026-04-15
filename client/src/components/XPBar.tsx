'use client';

function xpForLevel(level: number) {
  return level * level * 100;
}

interface XPBarProps {
  xp: number;
  level: number;
  compact?: boolean;
}

export default function XPBar({ xp, level, compact }: XPBarProps) {
  const currentLevelXp = xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);
  const progress = Math.min(
    ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100,
    100
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{xp} XP</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Level {level}</span>
        <span>{xp} / {nextLevelXp} XP</span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
