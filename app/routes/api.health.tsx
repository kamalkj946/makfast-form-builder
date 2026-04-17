import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const checks: Record<string, string> = {};

  checks.shopifyApiKey = process.env.SHOPIFY_API_KEY ? "ok" : "missing";
  checks.shopifyApiSecret = process.env.SHOPIFY_API_SECRET ? "ok" : "missing";
  checks.shopifyAppUrl = process.env.SHOPIFY_APP_URL ? "ok" : "missing";
  checks.scopes = process.env.SCOPES ? "ok" : "missing";
  checks.databaseUrl = process.env.DATABASE_URL ? "ok" : "missing";

  let db = "unknown";
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "ok";
  } catch (error: any) {
    db = "failed";
    dbError = error?.message ?? String(error);
  }

  return json({
    ok: db === "ok",
    now: new Date().toISOString(),
    path: new URL(request.url).pathname,
    checks,
    db,
    dbError,
  });
};

