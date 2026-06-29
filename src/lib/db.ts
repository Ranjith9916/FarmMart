import { PrismaClient } from '@prisma/client'
import { chmodSync, existsSync } from 'fs'
import { join } from 'path'

// Ensure the SQLite database file is writable
// (Fixes "attempt to write a readonly database" error)
const dbPath = join(process.cwd(), 'db', 'custom.db')
if (existsSync(dbPath)) {
  try {
    chmodSync(dbPath, 0o666)
  } catch {
    // ignore — might not have permissions in some environments
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
