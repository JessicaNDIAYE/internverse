'use client';

interface AvatarProps {
  avatar: string;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  level?: number;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export default function Avatar({ avatar, username, size = 'md', showLevel, level }: AvatarProps) {
  const letter = (avatar === 'default' ? username[0] : avatar)?.toUpperCase() ?? '?';
  const cls = avatar === 'default' ? 'avatar-default' : `avatar-${avatar}`;
  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} ${cls} rounded-xl flex items-center justify-center font-bold text-white select-none`}
        title={username}
      >
        {letter}
      </div>
      {showLevel && level !== undefined && (
        <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-dark-900 border border-dark-500 rounded-full w-5 h-5 flex items-center justify-center text-green-400">
          {level}
        </span>
      )}
    </div>
  );
}
