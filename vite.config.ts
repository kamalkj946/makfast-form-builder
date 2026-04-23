import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Check if we're running in a Shopify environment
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET)
) {
  console.warn(
    "\n⚠️  Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET environment variables.\n"
  );
}

// For Vercel, we don't need the Shopify HMR host
const host = new URL(
  process.env.SHOPIFY_APP_URL || "http://localhost:3000"
).hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
}

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
});
