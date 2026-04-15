import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, Button, Text, Badge, EmptyState,
  BlockStack, InlineStack, Banner, Spinner, Box, Divider,
  ResourceList, ResourceItem, Thumbnail,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { loadForms, deleteForm } from "../lib/metafield-storage";
import { createBlankForm } from "../lib/form-engine";
import { saveForm } from "../lib/metafield-storage";
import type { FormConfig } from "../lib/form-engine";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const forms = await loadForms(admin);
  return json({ forms });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "create") {
    const newForm = createBlankForm();
    await saveForm(admin, newForm);
    return redirect(`/app/forms/${newForm.id}`);
  }

  if (action === "delete") {
    const formId = formData.get("formId") as string;
    await deleteForm(admin, formId);
    return json({ success: true });
  }

  if (action === "duplicate") {
    const formId = formData.get("formId") as string;
    const forms = await loadForms(admin);
    const original = forms.find((f) => f.id === formId);
    if (original) {
      const { generateId } = await import("../lib/form-engine");
      const duplicate: FormConfig = {
        ...original,
        id: generateId(),
        title: `${original.title} (Copy)`,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveForm(admin, duplicate);
    }
    return json({ success: true });
  }

  return json({ error: "Unknown action" });
};

export default function Dashboard() {
  const { forms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  function handleCreate() {
    const fd = new FormData();
    fd.append("action", "create");
    submit(fd, { method: "POST" });
  }

  function handleDelete(formId: string) {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("formId", formId);
    submit(fd, { method: "POST" });
  }

  function handleDuplicate(formId: string) {
    const fd = new FormData();
    fd.append("action", "duplicate");
    fd.append("formId", formId);
    submit(fd, { method: "POST" });
  }

  const publishedCount = forms.filter((f) => f.status === "published").length;
  const totalSubmissions = 0; // Will be fetched separately

  return (
    <Page
      title="MakeFast Form Builder"
      subtitle="Build high-converting forms with zero speed impact"
      primaryAction={{
        content: "Create Form",
        onAction: handleCreate,
        loading: isLoading,
      }}
    >
      <Layout>
        {/* Stats Banner */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">Total Forms</Text>
                <Text as="p" variant="heading2xl" fontWeight="bold">{forms.length}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">Published</Text>
                <Text as="p" variant="heading2xl" fontWeight="bold" tone="success">{publishedCount}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">This Month</Text>
                <Text as="p" variant="heading2xl" fontWeight="bold">Free Plan</Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Forms List */}
        <Layout.Section>
          <Card padding="0">
            {forms.length === 0 ? (
              <EmptyState
                heading="Create your first form"
                action={{ content: "Create Form", onAction: handleCreate }}
                secondaryAction={{
                  content: "Learn more",
                  url: "https://makfast.app/docs",
                  external: true,
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Use our drag-and-drop builder or let AI generate a form for you in seconds.</p>
              </EmptyState>
            ) : (
              <ResourceList
                resourceName={{ singular: "form", plural: "forms" }}
                items={forms}
                renderItem={(form) => (
                  <ResourceItem
                    id={form.id}
                    onClick={() => navigate(`/app/forms/${form.id}`)}
                    shortcutActions={[
                      { content: "Edit", url: `/app/forms/${form.id}` },
                      { content: "Duplicate", onAction: () => handleDuplicate(form.id) },
                      { content: "Delete", onAction: () => handleDelete(form.id), destructive: true },
                    ]}
                    accessibilityLabel={`Edit form ${form.title}`}
                  >
                    <InlineStack gap="400" align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="bodyMd" fontWeight="semibold">
                          {form.title}
                        </Text>
                        <InlineStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">
                            {form.fields.length} fields
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">•</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Updated {new Date(form.updatedAt).toLocaleDateString()}
                          </Text>
                        </InlineStack>
                      </BlockStack>
                      <Badge tone={form.status === "published" ? "success" : "info"}>
                        {form.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            )}
          </Card>
        </Layout.Section>

        {/* Quick Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Quick Tips</Text>
              <Divider />
              <InlineStack gap="400" wrap>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">🤖 AI Generator</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Click "Generate with AI" in any form editor to build forms from plain text.
                    </Text>
                  </BlockStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">⚡ Zero Speed Impact</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Forms are pre-rendered as HTML—no heavy JS bundles to slow your store.
                    </Text>
                  </BlockStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">🎨 Theme Sync</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Click "Auto-Match Theme" in the Style tab to inherit your store's design.
                    </Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
