import { Resend } from "resend";

// ============================================================
// Resend Email Service — Free Tier (3,000 emails/month)
// ============================================================

/**
 * Send a form submission notification email to the merchant
 */
export async function sendSubmissionEmail(
  merchantEmail: string,
  formTitle: string,
  submissionData: Record<string, any>,
  shopDomain: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return false;
  }

  const resend = new Resend(apiKey);

  // Build a beautiful HTML email from the submission data
  const fieldsHtml = Object.entries(submissionData)
    .filter(([key]) => !key.startsWith("_")) // Skip internal fields
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; width: 35%; vertical-align: top;">
            ${escapeHtml(key)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #1a1a2e; font-size: 14px; font-weight: 500;">
            ${escapeHtml(String(value))}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
    </head>
    <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Inter', -apple-system, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6c5ce7 0%, #a855f7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700;">
            📋 New Form Submission
          </h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
            ${escapeHtml(formTitle)}
          </p>
        </div>

        <!-- Body -->
        <div style="background: #fff; border-radius: 0 0 16px 16px; padding: 0; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <table style="width: 100%; border-collapse: collapse;">
            ${fieldsHtml}
          </table>

          <div style="padding: 24px; text-align: center; border-top: 1px solid #f0f0f0;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              Submitted on ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}
              via <strong>${escapeHtml(shopDomain)}</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <p style="text-align: center; color: #bbb; font-size: 11px; margin-top: 24px;">
          Powered by <a href="#" style="color: #6c5ce7; text-decoration: none;">MakeFast Form Builder</a>
        </p>

      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "MakeFast Forms <forms@resend.dev>",
      to: merchantEmail,
      subject: `📋 New Submission: ${formTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending submission email:", error);
    return false;
  }
}

/** Escape HTML entities to prevent XSS in emails */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
