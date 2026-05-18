"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
router.use(auth_1.authenticateToken);
router.post('/', upload.single('image'), [
    (0, express_validator_1.body)('symbol').notEmpty().trim(),
    (0, express_validator_1.body)('entryPrice').toFloat().isFloat({ min: 0 }),
    (0, express_validator_1.body)('quantity').toInt().isInt({ min: 1 }),
    (0, express_validator_1.body)('entryDate').isISO8601(),
    (0, express_validator_1.body)('tradeType').optional().isIn(['LONG', 'SHORT']),
    (0, express_validator_1.body)('exitPrice').optional().toFloat().isFloat({ min: 0 }),
    (0, express_validator_1.body)('exitDate').optional().isISO8601(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('strategy').optional().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        console.log('validation errors ', errors.array());
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { symbol, entryPrice, quantity, entryDate, tradeType = 'LONG', exitPrice, exitDate, description, strategy, } = req.body;
        let pnl = null;
        if (exitPrice && exitDate) {
            if (tradeType === 'LONG') {
                pnl = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseInt(quantity);
            }
            else {
                pnl = (parseFloat(entryPrice) - parseFloat(exitPrice)) * parseInt(quantity);
            }
        }
        let strategyId = null;
        if (strategy && strategy.trim()) {
            let existingStrategy = await prisma_1.prisma.strategy.findFirst({
                where: {
                    name: strategy.trim(),
                    userId: req.user.id
                }
            });
            if (existingStrategy) {
                strategyId = existingStrategy.id;
            }
            else {
                const newStrategy = await prisma_1.prisma.strategy.create({
                    data: {
                        name: strategy.trim(),
                        description: `Strategy: ${strategy.trim()}`,
                        userId: req.user.id
                    }
                });
                strategyId = newStrategy.id;
            }
        }
        const trade = await prisma_1.prisma.trade.create({
            data: {
                userId: req.user.id,
                symbol: symbol.toUpperCase(),
                entryPrice: parseFloat(entryPrice),
                quantity: parseInt(quantity),
                entryDate: new Date(entryDate),
                tradeType: tradeType,
                exitPrice: exitPrice ? parseFloat(exitPrice) : null,
                exitDate: exitDate ? new Date(exitDate) : null,
                imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
                description,
                strategyId,
                pnl,
            }
        });
        res.status(201).json({
            message: 'Trade created successfully',
            trade
        });
    }
    catch (error) {
        console.error('Create trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/', async (req, res) => {
    try {
        const trades = await prisma_1.prisma.trade.findMany({
            where: { userId: req.user.id },
            include: {
                strategy: true
            },
            orderBy: { entryDate: 'desc' }
        });
        const stats = await prisma_1.prisma.trade.aggregate({
            where: {
                userId: req.user.id,
                pnl: { not: null }
            },
            _count: { id: true },
            _sum: { pnl: true },
        });
        const winningTrades = await prisma_1.prisma.trade.count({
            where: {
                userId: req.user.id,
                pnl: { gt: 0 }
            }
        });
        const losingTrades = await prisma_1.prisma.trade.count({
            where: {
                userId: req.user.id,
                pnl: { lt: 0 }
            }
        });
        const totalTrades = stats._count.id || 0;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const avgWin = winningTrades > 0 ?
            await prisma_1.prisma.trade.aggregate({
                where: {
                    userId: req.user.id,
                    pnl: { gt: 0 }
                },
                _avg: { pnl: true }
            }).then((result) => result._avg.pnl || 0) : 0;
        const avgLoss = losingTrades > 0 ?
            await prisma_1.prisma.trade.aggregate({
                where: {
                    userId: req.user.id,
                    pnl: { lt: 0 }
                },
                _avg: { pnl: true }
            }).then((result) => Math.abs(result._avg.pnl || 0)) : 0;
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
    }
    catch (error) {
        console.error('Get trades error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', [
    (0, express_validator_1.body)('symbol').optional().notEmpty().trim(),
    (0, express_validator_1.body)('entryPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('quantity').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('entryDate').optional().isISO8601(),
    (0, express_validator_1.body)('tradeType').optional().isIn(['LONG', 'SHORT']),
    (0, express_validator_1.body)('exitPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('exitDate').optional().isISO8601(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('strategy').optional().trim(),
], upload.single('image'), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const updateData = {};
        const existingTrade = await prisma_1.prisma.trade.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!existingTrade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        const updatableTradeFields = new Set([
            'symbol',
            'entryPrice',
            'quantity',
            'entryDate',
            'tradeType',
            'exitPrice',
            'exitDate',
            'description',
        ]);
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                if (!updatableTradeFields.has(key) && key !== 'strategy') {
                    return;
                }
                if (key === 'entryPrice' || key === 'exitPrice') {
                    updateData[key] = parseFloat(req.body[key]);
                }
                else if (key === 'quantity') {
                    updateData[key] = parseInt(req.body[key]);
                }
                else if (key === 'entryDate' || key === 'exitDate') {
                    updateData[key] = new Date(req.body[key]);
                }
                else if (key === 'symbol') {
                    updateData[key] = req.body[key].toUpperCase();
                }
                else if (key !== 'strategy') {
                    updateData[key] = req.body[key];
                }
            }
        });
        // Handle strategy field separately (it's a relation, not a direct field)
        if (req.body.strategy !== undefined) {
            if (req.body.strategy && req.body.strategy.trim()) {
                let existingStrategy = await prisma_1.prisma.strategy.findFirst({
                    where: {
                        name: req.body.strategy.trim(),
                        userId: req.user.id
                    }
                });
                if (existingStrategy) {
                    updateData.strategyId = existingStrategy.id;
                }
                else {
                    const newStrategy = await prisma_1.prisma.strategy.create({
                        data: {
                            name: req.body.strategy.trim(),
                            description: `Strategy: ${req.body.strategy.trim()}`,
                            userId: req.user.id
                        }
                    });
                    updateData.strategyId = newStrategy.id;
                }
            }
            else {
                // If strategy is empty string, set strategyId to null
                updateData.strategyId = null;
            }
        }
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
            }
            else {
                updateData.pnl = (finalEntryPrice - finalExitPrice) * finalQuantity;
            }
        }
        const trade = await prisma_1.prisma.trade.update({
            where: { id },
            data: updateData
        });
        res.json({
            message: 'Trade updated successfully',
            trade
        });
    }
    catch (error) {
        console.error('Update trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingTrade = await prisma_1.prisma.trade.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!existingTrade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        await prisma_1.prisma.trade.delete({
            where: { id }
        });
        res.json({ message: 'Trade deleted successfully' });
    }
    catch (error) {
        console.error('Delete trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=tradeController.js.map