import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

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
    sessionStorage: new PrismaSessionStorage(prisma),
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
    future: {
      unstable_newEmbeddedAuthStrategy: true,
      removeRest: true,
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
