"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Singleton pattern to prevent multiple PrismaClient instances
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Test connection on startup
exports.prisma.$connect()
    .then(() => {
    console.log('✅ Database connected successfully');
})
    .catch((error) => {
    console.error('❌ Database connection error:', error);
    console.error('Please check your DATABASE_URL environment variable.');
    console.error('For Supabase, ensure you are using the connection pooler URL (port 6543) with ?pgbouncer=true');
});
//# sourceMappingURL=prisma.js.map