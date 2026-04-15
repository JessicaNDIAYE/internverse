'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import type { GameResult } from '../../../../../../shared/types';

type Category = 'urgent' | 'normal' | 'spam';

interface Email {
  id: number;
  from: string;
  subject: string;
  preview: string;
  correct: Category;
  timeLimit: number; // ms to classify before penalty
}

const EMAIL_POOL: Omit<Email, 'id' | 'timeLimit'>[] = [
  { from: 'boss@corp.com', subject: '🔴 URGENT: Server is DOWN', preview: 'All hands on deck. Production is offline.', correct: 'urgent' },
  { from: 'noreply@win-prize.xyz', subject: 'You WON $1,000,000!!!', preview: 'Click here to claim your prize immediately.', correct: 'spam' },
  { from: 'hr@company.com', subject: 'Monthly newsletter', preview: "Here's what happened in the company this month.", correct: 'normal' },
  { from: 'ceo@corp.com', subject: '⚠️ CRITICAL security breach', preview: 'We detected unauthorized access. All passwords must be reset NOW.', correct: 'urgent' },
  { from: 'promo@deals.net', subject: 'Exclusive offer just for you!', preview: '50% off everything, today only! Limited time!', correct: 'spam' },
  { from: 'teammate@corp.com', subject: 'Re: Project deadline', preview: 'Hey, just checking in on the timeline for next week.', correct: 'normal' },
  { from: 'no-reply@bank-verify.tk', subject: 'Verify your account NOW', preview: 'Your bank account will be suspended if you don\'t act now.', correct: 'spam' },
  { from: 'client@bigcorp.com', subject: '🚨 Contract at risk', preview: 'If we don\'t receive the deliverable today, we terminate the contract.', correct: 'urgent' },
  { from: 'it@company.com', subject: 'Scheduled maintenance tonight', preview: 'Systems will be down from 11pm-2am for upgrades.', correct: 'normal' },
  { from: 'discount@mega-shop.biz', subject: 'Flash sale! 90% OFF!', preview: 'Don\'t miss out! Today only, everything at 90% discount!', correct: 'spam' },
  { from: 'legal@corp.com', subject: '🚨 Compliance deadline TODAY', preview: 'You must submit the compliance forms by 5pm or face penalties.', correct: 'urgent' },
  { from: 'colleague@corp.com', subject: 'Lunch plans?', preview: 'Hey, are you joining us for lunch today at noon?', correct: 'normal' },
  { from: 'alert@free-iphone.win', subject: 'Congratulations! You\'re selected', preview: 'You\'ve been chosen to receive a free iPhone 15.', correct: 'spam' },
  { from: 'support@client.com', subject: 'Bug reported in prod', preview: 'Hi, there\'s a critical bug affecting all users since this morning.', correct: 'urgent' },
  { from: 'admin@company.com', subject: 'Updated leave policy', preview: 'Please review the updated vacation policy attached.', correct: 'normal' },
  { from: 'security@paypa1.com', subject: 'Account locked - verify now', preview: 'Your Paypal account has been locked. Provide details to unlock.', correct: 'spam' },
  { from: 'manager@corp.com', subject: 'CRITICAL: Demo in 1 hour', preview: 'The investor demo is in 1 hour and the app is broken!', correct: 'urgent' },
  { from: 'team@corp.com', subject: 'Friday team lunch invite', preview: 'Joining for team lunch this Friday? RSVP by Thursday.', correct: 'normal' },
];

const GAME_DURATION = 60;
const ROOM_ID = `email-chaos-${Date.now()}`;

const CATEGORY_CONFIG = {
  urgent: { label: '🚨 Urgent', color: 'bg-red-500 hover:bg-red-400', border: 'border-red-500' },
  normal: { label: '📋 Normal', color: 'bg-blue-500 hover:bg-blue-400', border: 'border-blue-500' },
  spam: { label: '🗑️ Spam', color: 'bg-slate-600 hover:bg-slate-500', border: 'border-slate-500' },
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getEmailQueue(count: number): Email[] {
  const pool = shuffle(EMAIL_POOL);
  return pool.slice(0, count).map((e, i) => ({
    ...e,
    id: i,
    timeLimit: Math.max(2000, 5000 - i * 150), // increases difficulty
  }));
}

export default function EmailChaosGame() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [phase, setPhase] = useState<'lobby' | 'playing' | 'results'>('lobby');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [emailQueue, setEmailQueue] = useState<Email[]>([]);
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [processed, setProcessed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [liveScores, setLiveScores] = useState<GameResult[]>([]);
  const [finalResults, setFinalResults] = useState<GameResult[]>([]);
  const [xpEarned, setXpEarned] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const queueRef = useRef<Email[]>([]);
  const currentRef = useRef<Email | null>(null);

  const advanceEmail = useCallback(() => {
    if (queueRef.current.length === 0) {
      // Refill queue
      const newQueue = getEmailQueue(18);
      queueRef.current = newQueue.slice(1);
      currentRef.current = newQueue[0];
      setCurrentEmail(newQueue[0]);
      setEmailQueue(newQueue.slice(1));
    } else {
      currentRef.current = queueRef.current[0];
      queueRef.current = queueRef.current.slice(1);
      setCurrentEmail(currentRef.current);
      setEmailQueue([...queueRef.current]);
    }
  }, []);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = scoreRef.current;
    const xp = Math.round(50 + finalScore * 1.2);
    setXpEarned(xp);
    setPhase('results');

    const socket = getSocket();
    socket.emit('game:score_update', { roomId: ROOM_ID, score: finalScore });
    socket.emit('game:end', { roomId: ROOM_ID });

    api.post('/users/game-result', { gameType: 'EMAIL_CHAOS', score: finalScore, xpEarned: xp })
      .then((res: unknown) => {
        const data = res as { xp: number; level: number; leveledUp: boolean };
        updateUser({ xp: data.xp, level: data.level });
      })
      .catch(console.error);
  }, [updateUser]);

  function startGame() {
    const queue = getEmailQueue(18);
    queueRef.current = queue.slice(1);
    currentRef.current = queue[0];
    setEmailQueue(queue.slice(1));
    setCurrentEmail(queue[0]);
    setScore(0);
    scoreRef.current = 0;
    streakRef.current = 0;
    setStreak(0);
    setProcessed(0);
    setTimeLeft(GAME_DURATION);
    setPhase('playing');

    getSocket().emit('game:join', { gameType: 'EMAIL_CHAOS', roomId: ROOM_ID });

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function classify(cat: Category) {
    const email = currentRef.current;
    if (!email) return;

    const isCorrect = cat === email.correct;
    if (isCorrect) {
      streakRef.current += 1;
      const bonus = streakRef.current >= 3 ? Math.floor(streakRef.current * 5) : 0;
      const pts = 10 + bonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setFeedback({ text: bonus > 0 ? `+${pts} 🔥 x${streakRef.current} streak!` : `+${pts} pts ✓`, correct: true });
    } else {
      streakRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setStreak(0);
      setFeedback({ text: `-5 pts — Should be ${email.correct.toUpperCase()}`, correct: false });
    }

    setProcessed((p) => p + 1);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 800);
    advanceEmail();

    getSocket().emit('game:score_update', { roomId: ROOM_ID, score: scoreRef.current });
  }

  useEffect(() => {
    const socket = getSocket();
    socket.on('game:score_update', (data: { userId: string; username: string; score: number }) => {
      setLiveScores((prev) => {
        const updated = prev.filter((p) => p.userId !== data.userId);
        return [...updated, { userId: data.userId, username: data.username, score: data.score, rank: 0 }]
          .sort((a, b) => b.score - a.score)
          .map((p, i) => ({ ...p, rank: i + 1 }));
      });
    });
    socket.on('game:results', (data: { results: GameResult[] }) => setFinalResults(data.results));
    return () => {
      socket.off('game:score_update');
      socket.off('game:results');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 20 ? 'bg-cyan-400' : timeLeft > 10 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/game')} className="text-slate-500 hover:text-white transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          📧 Email Chaos
        </h1>
      </div>

      {/* LOBBY */}
      {phase === 'lobby' && (
        <div className="text-center py-12 space-y-6">
          <div className="text-7xl animate-float">📧</div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Email Chaos</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Sort incoming emails into Urgent, Normal, or Spam. Build streaks for bonus points.
              60 seconds of corporate madness.
            </p>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`px-4 py-2 rounded-xl text-white text-sm font-bold ${cfg.color.split(' ')[0]}`}>
                {cfg.label}
              </span>
            ))}
          </div>
          <button
            onClick={startGame}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all hover:scale-105 active:scale-95 glow-blue"
          >
            Start Game
          </button>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && currentEmail && (
        <div className="space-y-4">
          {/* HUD */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Time</span>
                <span className={timeLeft <= 10 ? 'text-red-400 font-bold animate-pulse' : ''}>{timeLeft}s</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${timerColor} rounded-full transition-all duration-1000`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{score}</p>
              <p className="text-xs text-slate-500">points</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400">📧 {processed} sorted</span>
            {streak >= 2 && (
              <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 animate-pulse-fast">
                🔥 {streak}x streak!
              </span>
            )}
            <span className="px-2 py-1 rounded-lg bg-dark-700 text-slate-400">{emailQueue.length + 1} remaining</span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold text-center animate-slide-in ${
              feedback.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {feedback.text}
            </div>
          )}

          {/* Email card */}
          <div className="bg-dark-800 rounded-2xl border-2 border-dark-600 overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-dark-600 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {currentEmail.from[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{currentEmail.from}</p>
                <p className="font-bold text-white truncate">{currentEmail.subject}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-slate-300 text-sm leading-relaxed">{currentEmail.preview}</p>
            </div>
          </div>

          {/* Category buttons */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([cat, cfg]) => (
              <button
                key={cat}
                onClick={() => classify(cat)}
                className={`py-4 rounded-2xl text-white font-bold text-sm transition-all duration-100 active:scale-95 ${cfg.color} border-2 border-transparent hover:border-white/20`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Live scores */}
          {liveScores.length > 0 && (
            <div className="bg-dark-800 rounded-xl border border-dark-600 p-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">Live Scores</p>
              <div className="space-y-1">
                {liveScores.slice(0, 5).map((p) => (
                  <div key={p.userId} className="flex justify-between text-sm">
                    <span className="text-slate-300">{p.username}</span>
                    <span className="text-white font-bold">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-3">📬</div>
            <h2 className="text-3xl font-bold text-white">Inbox Cleared!</h2>
            <p className="text-slate-400 mt-1">Final Score: <span className="text-cyan-400 font-bold text-xl">{score}</span></p>
            <p className="text-green-400 font-bold mt-1">+{xpEarned} XP earned!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Score', value: score, color: 'text-white' },
              { label: 'Emails Sorted', value: processed, color: 'text-cyan-400' },
            ].map((s) => (
              <div key={s.label} className="bg-dark-800 rounded-xl border border-dark-600 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {finalResults.length > 0 && (
            <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
              <div className="px-4 py-3 border-b border-dark-600">
                <p className="font-bold text-white">Game Leaderboard</p>
              </div>
              <div className="divide-y divide-dark-700">
                {finalResults.map((p) => (
                  <div key={p.userId} className={`flex items-center gap-3 px-4 py-3 ${p.userId === user?.id ? 'bg-cyan-500/5' : ''}`}>
                    <span className="text-lg w-8 text-center">
                      {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                    </span>
                    <span className="flex-1 text-white font-medium">{p.username}</span>
                    <span className="text-white font-bold">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setPhase('lobby'); setLiveScores([]); setFinalResults([]); }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:from-cyan-400 hover:to-blue-400 transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/game')}
              className="px-6 py-3 rounded-xl border border-dark-500 text-slate-300 font-bold hover:border-cyan-500 hover:text-cyan-400 transition-all"
            >
              Back to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
