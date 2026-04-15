'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import type { GameResult } from '../../../../../../shared/types';

interface CodeToken {
  id: number;
  text: string;
  isBug: boolean;
  clicked: boolean;
}

interface Snippet {
  title: string;
  tokens: { text: string; isBug: boolean }[];
}

const SNIPPETS: Snippet[] = [
  {
    title: 'Fix the JavaScript function',
    tokens: [
      { text: 'function', isBug: false }, { text: ' ', isBug: false },
      { text: 'sum', isBug: false }, { text: '(', isBug: false },
      { text: 'a', isBug: false }, { text: ',', isBug: false },
      { text: 'b', isBug: false }, { text: ')', isBug: false },
      { text: ' {\n  ', isBug: false },
      { text: 'return', isBug: false }, { text: ' ', isBug: false },
      { text: 'a', isBug: false }, { text: ' ', isBug: false },
      { text: '-', isBug: true }, // Bug: should be +
      { text: ' ', isBug: false }, { text: 'b', isBug: false },
      { text: ';\n}', isBug: false },
    ],
  },
  {
    title: 'Find the off-by-one error',
    tokens: [
      { text: 'for', isBug: false }, { text: ' (', isBug: false },
      { text: 'let', isBug: false }, { text: ' i = ', isBug: false },
      { text: '1', isBug: true }, // Bug: should be 0
      { text: '; i ', isBug: false }, { text: '<', isBug: false },
      { text: ' arr.length; i', isBug: false },
      { text: '++', isBug: false }, { text: ') {', isBug: false },
      { text: '\n  console.log(arr[i]);\n}', isBug: false },
    ],
  },
  {
    title: 'Spot the wrong comparison',
    tokens: [
      { text: 'if', isBug: false }, { text: ' (user.age ', isBug: false },
      { text: '=', isBug: true }, // Bug: should be ==
      { text: '= 18) {\n  ', isBug: false },
      { text: 'grantAccess', isBug: false }, { text: '();\n}', isBug: false },
    ],
  },
  {
    title: 'Null pointer danger',
    tokens: [
      { text: 'const', isBug: false }, { text: ' name = ', isBug: false },
      { text: 'user', isBug: true }, // Bug: should be user?.name
      { text: '.name;\n', isBug: false },
      { text: 'console', isBug: false },
      { text: '.log(name.toUpperCase());', isBug: false },
    ],
  },
  {
    title: 'Async bug',
    tokens: [
      { text: 'async', isBug: false }, { text: ' function fetchData() {\n  ', isBug: false },
      { text: 'const', isBug: false }, { text: ' data = ', isBug: false },
      { text: 'fetch', isBug: true }, // Bug: missing await
      { text: '(url);\n  return data.json();\n}', isBug: false },
    ],
  },
  {
    title: 'Wrong array method',
    tokens: [
      { text: 'const', isBug: false }, { text: ' doubled = arr.', isBug: false },
      { text: 'forEach', isBug: true }, // Bug: should be map
      { text: '(x => x * 2);', isBug: false },
    ],
  },
];

const GAME_DURATION = 60;
const ROOM_ID = `bug-hunt-${Date.now()}`;

export default function BugHuntGame() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [phase, setPhase] = useState<'lobby' | 'playing' | 'results'>('lobby');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [tokens, setTokens] = useState<CodeToken[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bugsFound, setBugsFound] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [liveScores, setLiveScores] = useState<GameResult[]>([]);
  const [finalResults, setFinalResults] = useState<GameResult[]>([]);
  const [xpEarned, setXpEarned] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);

  const loadSnippet = useCallback((idx: number) => {
    const s = SNIPPETS[idx % SNIPPETS.length];
    setTokens(s.tokens.map((t, i) => ({ ...t, id: i, clicked: false })));
    setFeedback(null);
  }, []);

  function startGame() {
    setPhase('playing');
    setScore(0);
    scoreRef.current = 0;
    setBugsFound(0);
    setWrongClicks(0);
    setTimeLeft(GAME_DURATION);
    setSnippetIdx(0);
    loadSnippet(0);

    const socket = getSocket();
    socket.emit('game:join', { gameType: 'BUG_HUNT', roomId: ROOM_ID });

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = scoreRef.current;
    const xp = Math.round(50 + finalScore * 1.5);
    setXpEarned(xp);
    setPhase('results');

    const socket = getSocket();
    socket.emit('game:score_update', { roomId: ROOM_ID, score: finalScore });
    socket.emit('game:end', { roomId: ROOM_ID });

    api.post('/users/game-result', { gameType: 'BUG_HUNT', score: finalScore, xpEarned: xp })
      .then((res: unknown) => {
        const data = res as { xp: number; level: number; leveledUp: boolean };
        updateUser({ xp: data.xp, level: data.level });
      })
      .catch(console.error);
  }, [updateUser]);

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
    socket.on('game:results', (data: { results: GameResult[] }) => {
      setFinalResults(data.results);
    });
    return () => {
      socket.off('game:score_update');
      socket.off('game:results');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleTokenClick(token: CodeToken) {
    if (token.clicked) return;
    setTokens((prev) =>
      prev.map((t) => (t.id === token.id ? { ...t, clicked: true } : t))
    );

    if (token.isBug) {
      const points = Math.max(10, Math.round(timeLeft * 1.5));
      scoreRef.current += points;
      setScore(scoreRef.current);
      setBugsFound((b) => b + 1);
      setFeedback(`+${points} pts — BUG FOUND! 🐛`);
      // Move to next snippet after finding the bug
      const nextIdx = snippetIdx + 1;
      setTimeout(() => {
        setSnippetIdx(nextIdx);
        loadSnippet(nextIdx);
      }, 800);
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setWrongClicks((w) => w + 1);
      setFeedback('-5 pts — Not a bug! ❌');
    }

    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1200);
  }

  const snippet = SNIPPETS[snippetIdx % SNIPPETS.length];
  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 20 ? 'bg-green-400' : timeLeft > 10 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/game')} className="text-slate-500 hover:text-white transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🐛 Bug Hunt
        </h1>
      </div>

      {/* LOBBY */}
      {phase === 'lobby' && (
        <div className="text-center py-12 space-y-6">
          <div className="text-7xl animate-float">🐛</div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Bug Hunt</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Code snippets will appear with one hidden bug each. Click the bug as fast as possible.
              Speed bonus: the faster you click, the more points you earn.
            </p>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { icon: '⏱', label: '60 seconds' },
              { icon: '🎯', label: 'Speed bonus' },
              { icon: '⚡', label: '+50–200 XP' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-2 rounded-xl bg-dark-800 border border-dark-600 text-sm text-slate-300 flex items-center gap-2">
                <span>{s.icon}</span>{s.label}
              </div>
            ))}
          </div>
          <button
            onClick={startGame}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold text-lg hover:from-green-400 hover:to-cyan-400 transition-all hover:scale-105 active:scale-95 glow-green"
          >
            Start Game
          </button>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && (
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
            <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400">🐛 {bugsFound} found</span>
            <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400">❌ {wrongClicks} misses</span>
            <span className="px-2 py-1 rounded-lg bg-dark-700 text-slate-400">Snippet {(snippetIdx % SNIPPETS.length) + 1}/{SNIPPETS.length}</span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold text-center animate-slide-in ${
              feedback.includes('BUG') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {feedback}
            </div>
          )}

          {/* Code snippet */}
          <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
            <div className="px-4 py-2 bg-dark-700 border-b border-dark-600 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-xs text-slate-500 ml-2 font-mono">{snippet.title}</span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed">
              <p className="text-xs text-slate-600 mb-3 font-sans">Click on the bug:</p>
              <div className="whitespace-pre-wrap">
                {tokens.map((token) => (
                  <span
                    key={token.id}
                    onClick={() => handleTokenClick(token)}
                    className={`inline ${
                      token.isBug && token.clicked
                        ? 'bg-green-500/30 text-green-300 rounded px-0.5 line-through'
                        : token.clicked && !token.isBug
                        ? 'bg-red-500/20 text-red-300 rounded px-0.5'
                        : token.isBug
                        ? 'cursor-pointer hover:bg-yellow-500/20 hover:text-yellow-300 rounded px-0.5 transition-colors'
                        : 'cursor-pointer hover:bg-dark-600 rounded px-0.5 transition-colors text-slate-200'
                    }`}
                  >
                    {token.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live scoreboard */}
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
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-bold text-white">Game Over!</h2>
            <p className="text-slate-400 mt-1">Final Score: <span className="text-green-400 font-bold text-xl">{score}</span></p>
            <p className="text-green-400 font-bold mt-1">+{xpEarned} XP earned!</p>
          </div>

          {/* Personal stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score, color: 'text-white' },
              { label: 'Bugs Found', value: bugsFound, color: 'text-green-400' },
              { label: 'Misses', value: wrongClicks, color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="bg-dark-800 rounded-xl border border-dark-600 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Final leaderboard */}
          {finalResults.length > 0 && (
            <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
              <div className="px-4 py-3 border-b border-dark-600">
                <p className="font-bold text-white">Game Leaderboard</p>
              </div>
              <div className="divide-y divide-dark-700">
                {finalResults.map((p) => (
                  <div key={p.userId} className={`flex items-center gap-3 px-4 py-3 ${p.userId === user?.id ? 'bg-green-500/5' : ''}`}>
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
              onClick={() => {
                setPhase('lobby');
                setLiveScores([]);
                setFinalResults([]);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold hover:from-green-400 hover:to-cyan-400 transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/game')}
              className="px-6 py-3 rounded-xl border border-dark-500 text-slate-300 font-bold hover:border-green-500 hover:text-green-400 transition-all"
            >
              Back to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
