"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
const authController_1 = __importDefault(require("./controllers/authController"));
const tradeController_1 = __importDefault(require("./controllers/tradeController"));
const strategyController_1 = __importDefault(require("./controllers/strategyController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Configure CORS to allow requests from frontend
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static('uploads'));
app.use('/auth', authController_1.default);
app.use('/trades', tradeController_1.default);
app.use('/strategies', strategyController_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
process.on('SIGINT', async () => {
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map