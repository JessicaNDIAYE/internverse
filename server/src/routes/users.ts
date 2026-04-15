import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function calcLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /users/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        xp: true,
        level: true,
        reputation: true,
        productivity: true,
        creativity: true,
        companyId: true,
        company: { select: { id: true, name: true } },
        gameResults: {
          select: { gameType: true, score: true, xpEarned: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ ...user, level: calcLevel(user.xp) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /users/game-result - record a game result and award XP
router.post('/game-result', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameType, score, xpEarned } = req.body;
  if (!gameType || score === undefined || xpEarned === undefined) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  try {
    await prisma.gameResult.create({
      data: { userId: req.userId!, gameType, score, xpEarned },
    });
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        xp: { increment: xpEarned },
        reputation: { increment: Math.floor(xpEarned / 10) },
        productivity: { increment: gameType === 'BUG_HUNT' ? Math.floor(score / 10) : 0 },
        creativity: { increment: gameType === 'EMAIL_CHAOS' ? Math.floor(score / 10) : 0 },
      },
      select: {
        id: true,
        xp: true,
        level: true,
        reputation: true,
        productivity: true,
        creativity: true,
      },
    });
    const newLevel = calcLevel(user.xp);
    const leveledUp = newLevel > user.level;
    if (leveledUp) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { level: newLevel },
      });
    }
    res.json({ ...user, level: newLevel, leveledUp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
