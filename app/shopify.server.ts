import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const storage = new PrismaSessionStorage(prisma);

// Adding a wrapper to catch database errors during session operations
const debugSessionStorage: typeof storage = {
  ...storage,
  loadSession: async (id) => {
    try {
      return await storage.loadSession(id);
    } catch (error) {
      console.error("DATABASE_ERROR (loadSession):", error);
      return undefined;
    }
  },
  storeSession: async (session) => {
    try {
      return await storage.storeSession(session);
    } catch (error) {
      console.error("DATABASE_ERROR (storeSession):", error);
      return false;
    }
  },
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  useOnlineTokens: true,
  sessionStorage: debugSessionStorage,
  distribution: AppDistribution.AppStore,
  future: {
    removeRest: true,
    v3_authenticatePublic: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = {
  ...shopify.authenticate,
  admin: async (request: Request) => {
    const url = new URL(request.url);
    console.log(`[auth-debug] Authenticating admin for: ${url.pathname}`);
    try {
      const result = await shopify.authenticate.admin(request);
      console.log(`[auth-debug] Authentication successful for: ${url.pathname}`);
      return result;
    } catch (error: any) {
      if (error instanceof Response && error.status >= 300 && error.status < 400) {
        console.log(`[auth-debug] Redirect detected: ${error.headers.get("Location")}`);
      } else {
        console.error(`[auth-debug] Authentication failed:`, error);
      }
      throw error;
    }
  },
};
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
