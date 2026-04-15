import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendSubmissionEmail } from "../lib/resend";
import { loadForms } from "../lib/metafield-storage";

// ============================================================
// App Proxy Submission Handler
// URL: /apps/makfast/submit
// Called by the storefront form via fetch()
// ============================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  // CORS headers for storefront requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Authenticate via App Proxy (Shopify signs the proxy request)
    const { storefront } = await authenticate.public.appProxy(request);

    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, any> = {};
    let formId = "";
    let shopDomain = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      data = body.data || {};
      formId = body.formId || "";
      shopDomain = body.shopDomain || "";
    } else {
      const formData = await request.formData();
      formId = formData.get("_formId") as string || "";
      shopDomain = formData.get("_shopDomain") as string || "";

      // Check honeypot (bots fill this hidden field)
      const honeypot = formData.get("_hp") as string;
      if (honeypot && honeypot.trim() !== "") {
        return json(
          { success: false, error: "Spam detected" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Extract all actual form fields (not internal _prefixed fields)
      for (const [key, value] of formData.entries()) {
        if (!key.startsWith("_")) {
          data[key] = value;
        }
      }
    }

    if (!formId) {
      return json(
        { success: false, error: "Missing form ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Save submission to DB
    const submission = await prisma.submission.create({
      data: {
        formId,
        formTitle: data._formTitle || "Form Submission",
        shopDomain,
        data: data,
        customerEmail: data.email || data.Email || null,
        isRead: false,
      },
    });

    // Send email notification (fire and forget)
    try {
      // Get merchant email from session (best effort)
      const notificationEmail =
        data._notificationEmail || `admin@${shopDomain}`;

      if (notificationEmail) {
        const formTitle = data._formTitle || "Form";
        // Clean data for email (remove internal fields)
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([k]) => !k.startsWith("_"))
        );
        await sendSubmissionEmail(notificationEmail, formTitle, cleanData, shopDomain);
      }
    } catch (emailErr) {
      console.error("Email send failed (non-fatal):", emailErr);
    }

    return json(
      { success: true, submissionId: submission.id },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Submission error:", err);
    return json(
      { success: false, error: "Server error. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
};

// Redirect GET requests to the app
export const loader = async ({ request }: ActionFunctionArgs) => {
  return json({ status: "MakeFast Form API" });
};
