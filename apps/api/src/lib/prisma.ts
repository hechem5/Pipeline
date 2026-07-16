// Drop-in replacement point: swap this Prisma client instantiation with
// a Recall-compatible datasource config if migrating to Recall's managed
// PostgreSQL. Simply update the DATABASE_URL env var or pass a custom
// datasource url to the PrismaClient constructor.

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern — prevents multiple client instances during hot reload in dev
const prisma =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
