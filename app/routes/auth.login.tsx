import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../shopify.server";

type LoginErrors = {
  shop?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = (await login(request)) as LoginErrors | undefined;
  return json({ errors: errors ?? null });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = (await login(request)) as LoginErrors | undefined;
  return json({ errors: errors ?? null });
};

export default function AuthLogin() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors ?? loaderData.errors;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f6f7",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#fff",
          border: "1px solid #e1e3e5",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Login to your store</h1>
        <p style={{ margin: "0 0 16px", color: "#616161", fontSize: 14 }}>
          Enter your `.myshopify.com` domain to continue.
        </p>

        <Form method="post">
          <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
            Shop domain
          </label>
          <input
            type="text"
            name="shop"
            placeholder="example.myshopify.com"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #c9cccf",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          {errors?.shop ? (
            <p style={{ color: "#b42318", fontSize: 13, margin: "0 0 12px" }}>
              {errors.shop}
            </p>
          ) : null}
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </Form>
      </div>
    </main>
  );
}
