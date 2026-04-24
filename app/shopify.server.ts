import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma, { ensureDatabaseSchema } from "./db.server";

const prismaSessionStorage = new PrismaSessionStorage(prisma);
const inMemorySessions = new Map<string, any>();

function isMissingTableError(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as any).message)
      : String(error);

  return (
    message.includes('The table `public.Session` does not exist') ||
    message.includes('relation "Session" does not exist') ||
    message.includes('relation "Submission" does not exist')
  );
}

async function withPrismaFallback<T>(
  operation: string,
  prismaCall: () => Promise<T>,
  fallbackCall: () => Promise<T> | T
): Promise<T> {
  try {
    return await prismaCall();
  } catch (error) {
    if (isMissingTableError(error)) {
      try {
        await ensureDatabaseSchema();
        return await prismaCall();
      } catch (schemaError) {
        console.error(
          `[shopify-session-storage] Failed to auto-initialize Prisma schema during ${operation}.`,
          schemaError
        );
      }
    }

    console.error(
      `[shopify-session-storage] Prisma ${operation} failed; falling back to in-memory storage.`,
      error
    );
    return await fallbackCall();
  }
}

const resilientSessionStorage = {
  storeSession: async (session: any) =>
    withPrismaFallback(
      "storeSession",
      () => prismaSessionStorage.storeSession(session),
      async () => {
        inMemorySessions.set(session.id, session);
        return true;
      }
    ),
  loadSession: async (id: string) => {
    console.log(`[shopify-session-storage] Loading session: ${id}`);
    return withPrismaFallback(
      "loadSession",
      () => prismaSessionStorage.loadSession(id),
      async () => inMemorySessions.get(id)
    );
  },
  deleteSession: async (id: string) =>
    withPrismaFallback(
      "deleteSession",
      () => prismaSessionStorage.deleteSession(id),
      async () => {
        inMemorySessions.delete(id);
        return true;
      }
    ),
  findSessionsByShop: async (shop: string) =>
    withPrismaFallback(
      "findSessionsByShop",
      () => prismaSessionStorage.findSessionsByShop(shop),
      async () =>
        Array.from(inMemorySessions.values()).filter(
          (session) => session.shop === shop
        )
    ),
  deleteSessions: async (ids: string[]) =>
    withPrismaFallback(
      "deleteSessions",
      () => prismaSessionStorage.deleteSessions(ids),
      async () => {
        ids.forEach((id) => inMemorySessions.delete(id));
        return true;
      }
    ),
};

let shopifyInstance: ReturnType<typeof shopifyApp> | null = null;

function getShopify() {
  if (shopifyInstance) return shopifyInstance;
  
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL;
  const scopes = process.env.SCOPES?.split(",").map((s) => s.trim()).filter(Boolean);

  if (!apiKey || !apiSecretKey || !appUrl) {
    throw new Error(
      "Missing Shopify env vars. Required: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL."
    );
  }

  shopifyInstance = shopifyApp({
    apiKey,
    apiSecretKey,
    apiVersion: ApiVersion.October24,
    scopes,
    appUrl,
    authPathPrefix: "/auth",
    sessionStorage: resilientSessionStorage as any,
    distribution: AppDistribution.AppStore,
    webhooks: {
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks",
      },
    },
    hooks: {
      afterAuth: async ({ session }) => {
        getShopify().registerWebhooks({ session });
      },
    },
    useOnlineTokens: true,
    future: {
      removeRest: true,
      v3_authenticatePublic: true,
      v3_lineItemBilling: true,
      v3_throwResponseException: true,
    },
    ...(process.env.SHOP_CUSTOM_DOMAIN
      ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
      : {}),
  });

  return shopifyInstance;
}

export default getShopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = (...args: Parameters<ReturnType<typeof shopifyApp>["addDocumentResponseHeaders"]>) =>
  getShopify().addDocumentResponseHeaders(...args);
export const authenticate = {
  admin: (...args: Parameters<ReturnType<typeof shopifyApp>["authenticate"]["admin"]>) =>
    getShopify().authenticate.admin(...args),
  public: {
    appProxy: (...args: Parameters<ReturnType<typeof shopifyApp>["authenticate"]["public"]["appProxy"]>) =>
      getShopify().authenticate.public.appProxy(...args),
  },
  webhook: (...args: Parameters<ReturnType<typeof shopifyApp>["authenticate"]["webhook"]>) =>
    getShopify().authenticate.webhook(...args),
};
export const unauthenticated = {
  admin: (...args: Parameters<ReturnType<typeof shopifyApp>["unauthenticated"]["admin"]>) =>
    getShopify().unauthenticated.admin(...args),
};
export const login = (...args: Parameters<ReturnType<typeof shopifyApp>["login"]>) =>
  getShopify().login(...args);
export const registerWebhooks = (...args: Parameters<ReturnType<typeof shopifyApp>["registerWebhooks"]>) =>
  getShopify().registerWebhooks(...args);
export const sessionStorage = {
  storeSession: (...args: Parameters<ReturnType<typeof shopifyApp>["sessionStorage"]["storeSession"]>) =>
    getShopify().sessionStorage.storeSession(...args),
  loadSession: (...args: Parameters<ReturnType<typeof shopifyApp>["sessionStorage"]["loadSession"]>) =>
    getShopify().sessionStorage.loadSession(...args),
  deleteSession: (...args: Parameters<ReturnType<typeof shopifyApp>["sessionStorage"]["deleteSession"]>) =>
    getShopify().sessionStorage.deleteSession(...args),
  findSessionsByShop: (...args: Parameters<ReturnType<typeof shopifyApp>["sessionStorage"]["findSessionsByShop"]>) =>
    getShopify().sessionStorage.findSessionsByShop(...args),
  deleteSessions: (...args: Parameters<ReturnType<typeof shopifyApp>["sessionStorage"]["deleteSessions"]>) =>
    getShopify().sessionStorage.deleteSessions(...args),
};
