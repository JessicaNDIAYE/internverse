import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  companyId?: string;
  avatar?: string;
  userLevel?: number;
}

// companyId -> Map<userId, player info>
const onlineByCompany = new Map<
  string,
  Map<string, { username: string; avatar: string; level: number; userId: string }>
>();

// roomId -> room state
const gameRooms = new Map<
  string,
  {
    players: Map<string, { username: string; score: number; userId: string }>;
    gameType: string;
    companyId: string;
  }
>();

function emitOnlineList(io: Server, companyId: string) {
  const players = Array.from(onlineByCompany.get(companyId)?.values() ?? []);
  io.to(`company:${companyId}`).emit('online:list', players);
}

async function broadcastLeaderboard(io: Server, companyId: string) {
  try {
    const players = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        xp: true,
        level: true,
        reputation: true,
      },
      orderBy: { xp: 'desc' },
      take: 20,
    });
    io.to(`company:${companyId}`).emit('leaderboard:update', players);
  } catch (err) {
    console.error('leaderboard broadcast error', err);
  }
}

export function setupSockets(io: Server) {
  // Auth middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = (socket.handshake.auth as Record<string, unknown>)?.token as string | undefined;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };
      socket.userId = payload.userId;
      socket.username = payload.username;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { companyId: true, avatar: true, level: true },
      });
      socket.companyId = user?.companyId ?? undefined;
      socket.avatar = user?.avatar ?? 'default';
      socket.userLevel = user?.level ?? 1;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;
    const companyId = socket.companyId;
    const avatar = socket.avatar ?? 'default';
    const userLevel = socket.userLevel ?? 1;

    // Join company room on connect
    if (companyId) {
      socket.join(`company:${companyId}`);
      if (!onlineByCompany.has(companyId)) {
        onlineByCompany.set(companyId, new Map());
      }
      onlineByCompany.get(companyId)!.set(userId, { username, avatar, level: userLevel, userId });
      emitOnlineList(io, companyId);
      socket.to(`company:${companyId}`).emit('player:joined', { userId, username, avatar });
    }

    // ── COMPANY JOIN (after selecting one) ───────────────────────────────
    socket.on('company:join', (data: { companyId: string; level: number }) => {
      // Leave old company room
      if (socket.companyId) {
        onlineByCompany.get(socket.companyId)?.delete(userId);
        emitOnlineList(io, socket.companyId);
        socket.to(`company:${socket.companyId}`).emit('player:left', { userId, username });
        socket.leave(`company:${socket.companyId}`);
      }
      socket.companyId = data.companyId;
      socket.join(`company:${data.companyId}`);
      if (!onlineByCompany.has(data.companyId)) {
        onlineByCompany.set(data.companyId, new Map());
      }
      onlineByCompany.get(data.companyId)!.set(userId, {
        username,
        avatar,
        level: data.level,
        userId,
      });
      emitOnlineList(io, data.companyId);
      socket.to(`company:${data.companyId}`).emit('player:joined', { userId, username, avatar });
    });

    // ── CHAT ──────────────────────────────────────────────────────────────
    socket.on('chat:message', (data: { message: string }) => {
      const cid = socket.companyId;
      if (!cid || !data.message?.trim()) return;
      const msg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        userId,
        username,
        avatar,
        message: data.message.slice(0, 300),
        timestamp: new Date().toISOString(),
      };
      io.to(`company:${cid}`).emit('chat:message', msg);
    });

    // ── GAME: JOIN ROOM ───────────────────────────────────────────────────
    socket.on('game:join', (data: { gameType: string; roomId: string }) => {
      const { gameType, roomId } = data;
      const cid = socket.companyId ?? '';
      socket.join(`game:${roomId}`);
      if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, { players: new Map(), gameType, companyId: cid });
      }
      gameRooms.get(roomId)!.players.set(userId, { username, score: 0, userId });
      io.to(`game:${roomId}`).emit('game:player_joined', {
        userId,
        username,
        playerCount: gameRooms.get(roomId)!.players.size,
      });
    });

    // ── GAME: SCORE UPDATE ────────────────────────────────────────────────
    socket.on('game:score_update', (data: { roomId: string; score: number }) => {
      const room = gameRooms.get(data.roomId);
      if (!room) return;
      if (room.players.has(userId)) {
        room.players.get(userId)!.score = data.score;
      }
      io.to(`game:${data.roomId}`).emit('game:score_update', {
        userId,
        username,
        score: data.score,
      });
    });

    // ── GAME: END / SUBMIT FINAL ──────────────────────────────────────────
    socket.on('game:end', (data: { roomId: string }) => {
      const room = gameRooms.get(data.roomId);
      if (!room) return;
      const results = Array.from(room.players.values())
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, rank: i + 1 }));
      io.to(`game:${data.roomId}`).emit('game:results', { results, gameType: room.gameType });
      if (room.companyId) broadcastLeaderboard(io, room.companyId);
      setTimeout(() => gameRooms.delete(data.roomId), 60000);
    });

    // ── LEADERBOARD REQUEST ───────────────────────────────────────────────
    socket.on('leaderboard:request', () => {
      if (socket.companyId) broadcastLeaderboard(io, socket.companyId);
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const cid = socket.companyId;
      if (cid) {
        onlineByCompany.get(cid)?.delete(userId);
        emitOnlineList(io, cid);
        socket.to(`company:${cid}`).emit('player:left', { userId, username });
      }
    });
  });
}
