import { PrismaClient } from '@prisma/client';

// Singleton pattern to prevent multiple PrismaClient instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    console.error('Please check your DATABASE_URL environment variable.');
    console.error('For Supabase, ensure you are using the connection pooler URL (port 6543) with ?pgbouncer=true');
  });
