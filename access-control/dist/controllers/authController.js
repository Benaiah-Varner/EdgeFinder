"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const generateToken = (userId, email) => {
    return jsonwebtoken_1.default.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').optional().trim(),
    (0, express_validator_1.body)('lastName').optional().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/user/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Ensure user can only access their own data
        if (req.user.id !== id) {
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
                        exitDate: true,
                        tradeType: true,
                        pnl: true,
                        description: true,
                        imageUrl: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            trades: user.trades
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=authController.js.map