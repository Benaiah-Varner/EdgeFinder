import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /strategies - Get all strategies for the current user with their trades
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const strategies = await prisma.strategy.findMany({
            where: { userId: req.user!.id },
            include: {
                trades: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            strategies,
            count: strategies.length
        });
    } catch (error) {
        console.error('Get strategies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /strategies - Create a new strategy for the current user
router.post('/', [
    body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description } = req.body;

        // Check if strategy with same name already exists for this user
        const existingStrategy = await prisma.strategy.findFirst({
            where: {
                name: name.trim(),
                userId: req.user!.id
            }
        });

        if (existingStrategy) {
            return res.status(400).json({
                error: 'Strategy with this name already exists for this user'
            });
        }

        const strategy = await prisma.strategy.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                userId: req.user!.id
            },
            include: {
                trades: true
            }
        });

        res.status(201).json({
            message: 'Strategy created successfully',
            strategy
        });
    } catch (error) {
        console.error('Create strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /strategies/:id - Update a strategy
router.put('/:id', [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, description } = req.body;

        // Check if strategy exists and belongs to the current user
        const existingStrategy = await prisma.strategy.findFirst({
            where: {
                id,
                userId: req.user!.id
            }
        });

        if (!existingStrategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // If name is being updated, check for duplicates
        if (name && name.trim() !== existingStrategy.name) {
            const duplicateStrategy = await prisma.strategy.findFirst({
                where: {
                    name: name.trim(),
                    userId: req.user!.id,
                    id: { not: id }
                }
            });

            if (duplicateStrategy) {
                return res.status(400).json({
                    error: 'Strategy with this name already exists for this user'
                });
            }
        }

        const updateData: any = {};
        if (name !== undefined) {
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description?.trim() || null;
        }

        const strategy = await prisma.strategy.update({
            where: { id },
            data: updateData,
            include: {
                trades: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        res.json({
            message: 'Strategy updated successfully',
            strategy
        });
    } catch (error) {
        console.error('Update strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /strategies/:id - Delete a strategy
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if strategy exists and belongs to the current user
        const existingStrategy = await prisma.strategy.findFirst({
            where: {
                id,
                userId: req.user!.id
            },
            include: {
                trades: true
            }
        });

        if (!existingStrategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy has associated trades
        if (existingStrategy.trades.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete strategy that has associated trades. Please reassign or delete the trades first.'
            });
        }

        await prisma.strategy.delete({
            where: { id }
        });

        res.json({
            message: 'Strategy deleted successfully',
            deletedStrategy: {
                id: existingStrategy.id,
                name: existingStrategy.name
            }
        });
    } catch (error) {
        console.error('Delete strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 