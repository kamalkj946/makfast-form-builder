import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate, login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (normalizedPath === "/auth") {
    await login(request);
    return null;
  }

  await authenticate.admin(request);
  return null;
};
