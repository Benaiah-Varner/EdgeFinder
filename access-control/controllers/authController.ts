import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Ensure user can only access their own data
    if (req.user!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        trades: {
          select: {
            id: true,
            symbol: true,
            entryPrice: true,
            exitPrice: true,
            quantity: true,
            entryDate: true,
            entryTime: true,
            exitDate: true,
            exitTime: true,
            tradeType: true,
            pnl: true,
            description: true,
            imageUrl: true,
            properEntry: true,
            R: true,
            alignedWithTrend: true,
            properConditions: true,
            followedTpPlan: true,
            properSize: true,
            createdAt: true,
            updatedAt: true,
            strategy: true,
            strategyId: true,
          }
        }
      }
    });
    console.log('user.trades', user?.trades);
    console.log('user.trades[0].R', typeof user?.trades[user?.trades.length - 1].R);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const safeUser = user && {
      ...user,
      trades: user.trades.map(t => ({
        ...t,
        // R: t.R?.toString?.() ?? String(t.R), // exact
        R: t.R?.toNumber?.() ?? Number(t.R), // convenient but float
      })),
    };
    
    res.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      trades: safeUser?.trades
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;