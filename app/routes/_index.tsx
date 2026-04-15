import type { LoaderFunctionArgs } from "@remix-run/node";
import { login } from "../shopify.server";
import { json, redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/auth/login?${url.searchParams.toString()}`);
  }
  return json({ showForm: Boolean(url.searchParams.get("loginWithEmail")) });
};

export default function Index() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      color: "#fff",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "linear-gradient(135deg, #6c5ce7, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: 36,
        }}>⚡</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px" }}>
          MakeFast Form Builder
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, margin: "0 0 32px" }}>
          Build high-converting, logic-based forms in seconds.
          Zero Speed Impact. Zero Cost.
        </p>
        <a
          href="/auth/login"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #6c5ce7, #a855f7)",
            color: "#fff",
            padding: "14px 32px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Install on Shopify →
        </a>
      </div>
    </div>
  );
}
