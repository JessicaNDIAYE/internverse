import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /companies - list all companies
router.get('/', async (_req, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { players: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /companies/:id/join
router.post('/:id/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { companyId: id },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        xp: true,
        level: true,
        reputation: true,
        companyId: true,
      },
    });
    res.json({ user, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /companies/:id/leaderboard
router.get('/:id/leaderboard', async (req, res: Response) => {
  const { id } = req.params;
  try {
    const players = await prisma.user.findMany({
      where: { companyId: id },
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
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
