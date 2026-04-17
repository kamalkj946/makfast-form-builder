import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

const prisma: PrismaClient = global.prisma;

let schemaInitPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema() {
  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "shop" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "isOnline" BOOLEAN NOT NULL DEFAULT FALSE,
        "scope" TEXT,
        "expires" TIMESTAMP(3),
        "accessToken" TEXT NOT NULL,
        "userId" BIGINT,
        "firstName" TEXT,
        "lastName" TEXT,
        "email" TEXT,
        "accountOwner" BOOLEAN NOT NULL DEFAULT FALSE,
        "locale" TEXT,
        "collaborator" BOOLEAN DEFAULT FALSE,
        "emailVerified" BOOLEAN DEFAULT FALSE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Submission" (
        "id" TEXT PRIMARY KEY,
        "formId" TEXT NOT NULL,
        "formTitle" TEXT NOT NULL DEFAULT '',
        "shopDomain" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "customerEmail" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Submission_shopDomain_idx" ON "Submission" ("shopDomain");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Submission_formId_idx" ON "Submission" ("formId");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Submission_createdAt_idx" ON "Submission" ("createdAt");`
    );
  })();

  try {
    await schemaInitPromise;
  } catch (error) {
    schemaInitPromise = null;
    throw error;
  }
}

export default prisma;
