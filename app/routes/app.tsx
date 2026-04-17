import { Outlet } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    if (error instanceof Response && [401, 403, 410].includes(error.status)) {
      const url = new URL(request.url);
      const params = new URLSearchParams();
      const shop = url.searchParams.get("shop");
      const host = url.searchParams.get("host");

      if (shop) params.set("shop", shop);
      if (host) params.set("host", host);

      const query = params.toString();
      throw redirect(query ? `/auth/login?${query}` : "/auth/login");
    }

    throw error;
  }

  return json({ ok: true });
};

export default function AppLayout() {
  return (
    <>
      <NavMenu>
        <a href="/app" rel="home">Dashboard</a>
        <a href="/app/submissions">Submissions</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
    </>
  );
}
