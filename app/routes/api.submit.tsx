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
    await authenticate.public.appProxy(request);

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
          // If a key has multiple values (e.g. multiple checkboxes), merge them into an array
          if (data[key]) {
            if (Array.isArray(data[key])) {
              data[key].push(value);
            } else {
              data[key] = [data[key], value];
            }
          } else {
            data[key] = value;
          }
        }
      }
    }

    if (!formId || !shopDomain) {
      return json(
        { success: false, error: "Missing form ID or shop domain" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use unauthenticated admin to fetch the form config from the shop's metafields safely
    const { unauthenticated } = await import("../shopify.server");
    const { admin } = await unauthenticated.admin(shopDomain);
    const forms = await loadForms(admin);
    const formConfig = forms.find((f) => f.id === formId);

    if (!formConfig) {
      return json(
        { success: false, error: "Form configuration not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // SERVER-SIDE VALIDATION & LOGIC EVALUATION
    const { evaluateAllConditions, validateField } = await import("../lib/condition-engine");
    const { hiddenFieldIds, requiredFieldIds } = evaluateAllConditions(formConfig.conditions, data);
    
    const errors: Record<string, string> = {};
    
    for (const field of formConfig.fields) {
      // Don't validate layout fields or hidden fields
      if (["heading", "paragraph", "divider"].includes(field.type)) continue;
      if (hiddenFieldIds.has(field.id)) continue;
      
      const isRequired = field.required || requiredFieldIds.has(field.id);
      const value = data[field.id];
      const error = validateField(value, isRequired, field.validation);
      
      if (error) {
        errors[field.id] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return json(
        { success: false, error: "Validation failed", validationErrors: errors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Save submission to DB
    const submission = await prisma.submission.create({
      data: {
        formId,
        formTitle: formConfig.title,
        shopDomain,
        data: data,
        customerEmail: data.email || data.Email || null,
        isRead: false,
      },
    });

    // Send email notification (fire and forget)
    if (formConfig.settings.emailNotification) {
      try {
        const notificationEmail = formConfig.settings.notificationEmail || `admin@${shopDomain}`;
        if (notificationEmail) {
          // Clean data for email (remove files metadata or map IDs to labels for readability)
          const readableData: Record<string, any> = {};
          
          for (const [key, value] of Object.entries(data)) {
             const fieldConfig = formConfig.fields.find(f => f.id === key);
             if (fieldConfig) {
               readableData[fieldConfig.label] = value;
             } else {
               readableData[key] = value;
             }
          }
          
          await sendSubmissionEmail(notificationEmail, formConfig.title, readableData, shopDomain);
        }
      } catch (emailErr) {
        console.error("Email send failed (non-fatal):", emailErr);
      }
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
