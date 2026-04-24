import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

function mask(value: string) {
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json(
      { ok: false, message: "Pass ?shop=your-store.myshopify.com" },
      { status: 400 }
    );
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { shop },
      orderBy: { id: "desc" },
      take: 10,
      select: {
        id: true,
        isOnline: true,
        scope: true,
        expires: true,
        shop: true,
      },
    });

    return json({
      ok: true,
      shop,
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: mask(s.id),
        isOnline: s.isOnline,
        hasScope: Boolean(s.scope),
        expires: s.expires,
        shop: s.shop,
      })),
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        shop,
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
};
