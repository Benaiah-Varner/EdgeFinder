import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.use(authenticateToken);

router.post('/', [
  body('symbol').notEmpty().trim(),
  body('entryPrice').isFloat({ min: 0 }),
  body('quantity').isInt({ min: 1 }),
  body('entryDate').isISO8601(),
  body('tradeType').optional().isIn(['LONG', 'SHORT']),
  body('exitPrice').optional().isFloat({ min: 0 }),
  body('exitDate').optional().isISO8601(),
  body('description').optional().trim(),
], upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('req user ', req.user);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      symbol,
      entryPrice,
      quantity,
      entryDate,
      tradeType = 'LONG',
      exitPrice,
      exitDate,
      description
    } = req.body;

    let pnl = null;

    if (exitPrice && exitDate) {
      if (tradeType === 'LONG') {
        pnl = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseInt(quantity);
      } else {
        pnl = (parseFloat(entryPrice) - parseFloat(exitPrice)) * parseInt(quantity);
      }
    }

    const trade = await prisma.trade.create({
      data: {
        userId: req.user!.id,
        symbol: symbol.toUpperCase(),
        entryPrice: parseFloat(entryPrice),
        quantity: parseInt(quantity),
        entryDate: new Date(entryDate),
        tradeType: tradeType,
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        exitDate: exitDate ? new Date(exitDate) : null,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        description,
        pnl,
      }
    });

    res.status(201).json({
      message: 'Trade created successfully',
      trade
    });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    const stats = await prisma.trade.aggregate({
      where: {
        userId: req.user!.id,
        pnl: { not: null }
      },
      _count: { id: true },
      _sum: { pnl: true },
    });

    const winningTrades = await prisma.trade.count({
      where: {
        userId: req.user!.id,
        pnl: { gt: 0 }
      }
    });

    const losingTrades = await prisma.trade.count({
      where: {
        userId: req.user!.id,
        pnl: { lt: 0 }
      }
    });

    const totalTrades = stats._count.id || 0;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const avgWin = winningTrades > 0 ?
      await prisma.trade.aggregate({
        where: {
          userId: req.user!.id,
          pnl: { gt: 0 }
        },
        _avg: { pnl: true }
      }).then((result: any) => result._avg.pnl || 0) : 0;

    const avgLoss = losingTrades > 0 ?
      await prisma.trade.aggregate({
        where: {
          userId: req.user!.id,
          pnl: { lt: 0 }
        },
        _avg: { pnl: true }
      }).then((result: any) => Math.abs(result._avg.pnl || 0)) : 0;

    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    res.json({
      trades,
      stats: {
        totalTrades,
        totalPnl: stats._sum.pnl || 0,
        winRate: Math.round(winRate * 100) / 100,
        riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
        winningTrades,
        losingTrades
      }
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', [
  body('symbol').optional().notEmpty().trim(),
  body('entryPrice').optional().isFloat({ min: 0 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('entryDate').optional().isISO8601(),
  body('tradeType').optional().isIn(['LONG', 'SHORT']),
  body('exitPrice').optional().isFloat({ min: 0 }),
  body('exitDate').optional().isISO8601(),
  body('description').optional().trim(),
], upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData: any = {};

    const existingTrade = await prisma.trade.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!existingTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'entryPrice' || key === 'exitPrice') {
          updateData[key] = parseFloat(req.body[key]);
        } else if (key === 'quantity') {
          updateData[key] = parseInt(req.body[key]);
        } else if (key === 'entryDate' || key === 'exitDate') {
          updateData[key] = new Date(req.body[key]);
        } else if (key === 'symbol') {
          updateData[key] = req.body[key].toUpperCase();
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const finalEntryPrice = updateData.entryPrice || existingTrade.entryPrice;
    const finalExitPrice = updateData.exitPrice || existingTrade.exitPrice;
    const finalQuantity = updateData.quantity || existingTrade.quantity;
    const finalTradeType = updateData.tradeType || existingTrade.tradeType;
    const finalExitDate = updateData.exitDate || existingTrade.exitDate;

    if (finalExitPrice && finalExitDate) {
      if (finalTradeType === 'LONG') {
        updateData.pnl = (finalExitPrice - finalEntryPrice) * finalQuantity;
      } else {
        updateData.pnl = (finalEntryPrice - finalExitPrice) * finalQuantity;
      }
    }

    const trade = await prisma.trade.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Trade updated successfully',
      trade
    });
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingTrade = await prisma.trade.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!existingTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    await prisma.trade.delete({
      where: { id }
    });

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;