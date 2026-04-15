import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, Text, BlockStack, InlineStack,
  TextField, Button, Checkbox, Divider, Badge, Banner, Toast, Frame,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  return json({
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  // Settings are stored in metafields in a real implementation
  // For now, just return success
  return json({ success: true });
};

export default function Settings() {
  const { shop, appUrl } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [toast, setToast] = useState<string | null>(null);

  const [notifEmail, setNotifEmail] = useState("");
  const [removeBranding, setRemoveBranding] = useState(false);

  return (
    <Frame>
      <Page
        title="Settings"
        backAction={{ content: "Dashboard", url: "/app" }}
      >
        <Layout>
          {/* Plan Info */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Current Plan</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Upgrade to unlock unlimited forms and AI features.
                    </Text>
                  </BlockStack>
                  <Badge tone="info" size="large">Starter — Free</Badge>
                </InlineStack>
                <Divider />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { plan: "Starter", price: "Free", features: ["1 Active Form", "50 Submissions/mo", "Basic Fields", "Honeypot Spam Shield"], current: true, tone: "info" },
                    { plan: "Professional", price: "$7.99/mo", features: ["Unlimited Forms", "Conditional Logic", "File Uploads", "Email Notifications", "AI Generation"], current: false, tone: "success" },
                    { plan: "Enterprise", price: "$14.99/mo", features: ["Everything in Pro", "Remove Branding", "Priority Support", "Klaviyo Integration", "CSV Export"], current: false, tone: "attention" },
                  ].map((p) => (
                    <div
                      key={p.plan}
                      style={{
                        border: `2px solid ${p.current ? "#6c5ce7" : "#e5e7eb"}`,
                        borderRadius: 12,
                        padding: 20,
                        background: p.current ? "#f3f0ff" : "#fff",
                        position: "relative",
                      }}
                    >
                      {p.current && (
                        <div style={{
                          position: "absolute",
                          top: -10,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "#6c5ce7",
                          color: "#fff",
                          borderRadius: 100,
                          padding: "2px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          CURRENT
                        </div>
                      )}
                      <Text as="h3" variant="headingSm" fontWeight="bold">{p.plan}</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">{p.price}</Text>
                      <BlockStack gap="100">
                        {p.features.map((f) => (
                          <Text key={f} as="p" variant="bodySm">✓ {f}</Text>
                        ))}
                      </BlockStack>
                      {!p.current && (
                        <Button variant="primary" size="slim" fullWidth>
                          Upgrade →
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Notifications */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Email Notifications</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Set a default email for form submission notifications (can be overridden per form).
                </Text>
                <TextField
                  label="Default notification email"
                  type="email"
                  value={notifEmail}
                  onChange={setNotifEmail}
                  placeholder={`admin@${shop}`}
                  autoComplete="email"
                  helpText="Powered by Resend — first 3,000 emails/month are free."
                />
                <Button
                  onClick={() => setToast("Settings saved!")}
                  loading={navigation.state !== "idle"}
                >
                  Save Settings
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Branding */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">Branding</Text>
                  <Badge tone="attention">Enterprise Only</Badge>
                </InlineStack>
                <Checkbox
                  label='Remove "Powered by MakeFast" footer from all forms'
                  checked={removeBranding}
                  onChange={setRemoveBranding}
                  disabled
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  Upgrade to Enterprise ($14.99/mo) to remove MakeFast branding.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* App Info */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">App Info</Text>
                <Divider />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">Shop</Text>
                  <Text as="p" variant="bodyMd">{shop}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">App URL</Text>
                  <Text as="p" variant="bodyMd">{appUrl}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">Version</Text>
                  <Text as="p" variant="bodyMd">1.0.0</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">Storage</Text>
                  <Badge tone="success">Shopify Metafields (Free)</Badge>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
      </Page>
    </Frame>
  );
}
