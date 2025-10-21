import { PrismaClient } from '@prisma/client'

const resolvedDatabaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING

const hasEnv = {
  DATABASE_URL: !!process.env.DATABASE_URL,
  POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
  PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL
}

console.log(
  'Prisma init (non-sensitive):',
  hasEnv,
  resolvedDatabaseUrl
    ? `resolved provider: ${resolvedDatabaseUrl.split('://')[0]}`
    : 'resolvedDatabaseUrl: undefined'
)

if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Provide a valid connection string (e.g. set POSTGRES_PRISMA_URL or DATABASE_URL).'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL ?? resolvedDatabaseUrl
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
