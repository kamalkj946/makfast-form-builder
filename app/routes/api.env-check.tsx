import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const apiKey = process.env.SHOPIFY_API_KEY || "MISSING";
  const apiSecret = process.env.SHOPIFY_API_SECRET || "MISSING";
  const appUrl = process.env.SHOPIFY_APP_URL || "MISSING";

  const mask = (val: string) => {
    if (val === "MISSING") return val;
    if (val.length <= 6) return "***";
    return `${val.slice(0, 3)}...${val.slice(-3)}`;
  };

  return json({
    apiKey: mask(apiKey),
    apiKeyFullMatch: apiKey === "373cfeb54817653257d31930102573a2",
    apiSecret: mask(apiSecret),
    appUrl,
    nodeEnv: process.env.NODE_ENV,
  });
};
