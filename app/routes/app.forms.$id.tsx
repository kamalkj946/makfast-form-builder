import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useNavigate } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page, Layout, Card, Button, Text, Badge, Tabs, Toast, Frame,
  BlockStack, InlineStack, Divider, Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getForm, saveForm, publishFormsToStorefront, loadForms } from "../lib/metafield-storage";
import type { FormConfig, FormField, Condition } from "../lib/form-engine";
import { generateId } from "../lib/form-engine";
import { detectThemeStyle } from "../lib/theme-detector";
import { generateFormFromPrompt } from "../lib/gemini";

// Builder Components
import { FormCanvas } from "../components/builder/FormCanvas";
import { FieldPalette } from "../components/builder/FieldPalette";
import { FieldSettings } from "../components/builder/FieldSettings";
import { LogicBuilder } from "../components/builder/LogicBuilder";
import { StyleEditor } from "../components/builder/StyleEditor";
import { FormPreview } from "../components/builder/FormPreview";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formId = params.id as string;
  const form = await getForm(admin, formId);
  if (!form) throw new Response("Form not found", { status: 404 });
  return json({ form });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const formId = params.id as string;

  if (intent === "save") {
    const formConfig = JSON.parse(formData.get("formConfig") as string) as FormConfig;
    await saveForm(admin, { ...formConfig, updatedAt: new Date().toISOString() });
    return json({ success: true, message: "Form saved!" });
  }

  if (intent === "publish") {
    const formConfig = JSON.parse(formData.get("formConfig") as string) as FormConfig;
    const updated = { ...formConfig, status: "published" as const, updatedAt: new Date().toISOString() };
    await saveForm(admin, updated);
    const allForms = await loadForms(admin);
    await publishFormsToStorefront(admin, allForms);
    return json({ success: true, message: "Form published to storefront!" });
  }

  if (intent === "unpublish") {
    const formConfig = JSON.parse(formData.get("formConfig") as string) as FormConfig;
    const updated = { ...formConfig, status: "draft" as const, updatedAt: new Date().toISOString() };
    await saveForm(admin, updated);
    const allForms = await loadForms(admin);
    await publishFormsToStorefront(admin, allForms);
    return json({ success: true, message: "Form unpublished." });
  }

  if (intent === "detect_theme") {
    const themeStyle = await detectThemeStyle(admin);
    return json({ themeStyle });
  }

  return json({ error: "Unknown intent" });
};

const TABS = [
  { id: "build", content: "🧱 Build" },
  { id: "logic", content: "⚡ Logic" },
  { id: "style", content: "🎨 Style" },
  { id: "preview", content: "👁 Preview" },
];

export default function FormEditor() {
  const { form: initialForm } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormConfig>(initialForm as FormConfig);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const isSaving = navigation.state !== "idle";

  const selectedField = form.fields.find((f) => f.id === selectedFieldId) || null;

  // Save form
  const handleSave = useCallback(() => {
    const fd = new FormData();
    fd.append("intent", "save");
    fd.append("formConfig", JSON.stringify(form));
    submit(fd, { method: "POST" });
    setToast({ message: "Saved successfully!" });
  }, [form, submit]);

  // Publish
  const handlePublish = useCallback(() => {
    const fd = new FormData();
    fd.append("intent", form.status === "published" ? "unpublish" : "publish");
    fd.append("formConfig", JSON.stringify(form));
    submit(fd, { method: "POST" });
    setForm((f) => ({ ...f, status: f.status === "published" ? "draft" : "published" }));
    setToast({ message: form.status === "published" ? "Form unpublished." : "Form published to storefront!" });
  }, [form, submit]);

  // Update a field
  const updateField = useCallback((updatedField: FormField) => {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((field) => field.id === updatedField.id ? updatedField : field),
    }));
  }, []);

  // Add field from palette (drop or click)
  const addField = useCallback((field: FormField) => {
    setForm((f) => ({ ...f, fields: [...f.fields, field] }));
    setSelectedFieldId(field.id);
  }, []);

  // Remove field
  const removeField = useCallback((fieldId: string) => {
    setForm((f) => ({
      ...f,
      fields: f.fields.filter((field) => field.id !== fieldId),
      conditions: f.conditions.filter(
        (c) => c.sourceFieldId !== fieldId && c.targetFieldId !== fieldId
      ),
    }));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  }, [selectedFieldId]);

  // Reorder fields
  const reorderFields = useCallback((newFields: FormField[]) => {
    setForm((f) => ({ ...f, fields: newFields }));
  }, []);

  // Update conditions
  const updateConditions = useCallback((conditions: Condition[]) => {
    setForm((f) => ({ ...f, conditions }));
  }, []);

  // Auto-detect theme
  const handleDetectTheme = useCallback(async () => {
    const fd = new FormData();
    fd.append("intent", "detect_theme");
    submit(fd, { method: "POST" });
    setToast({ message: "Theme colors detected and applied!" });
  }, [submit]);

  return (
    <Frame>
      <Page
        title={form.title}
        titleMetadata={
          <Badge tone={form.status === "published" ? "success" : "info"}>
            {form.status === "published" ? "Published" : "Draft"}
          </Badge>
        }
        backAction={{ content: "Dashboard", url: "/app" }}
        primaryAction={{
          content: form.status === "published" ? "Unpublish" : "Publish",
          onAction: handlePublish,
          loading: isSaving,
          tone: form.status === "published" ? undefined : "success",
        }}
        secondaryActions={[
          { content: "💾 Save", onAction: handleSave, loading: isSaving },
        ]}
      >
        <Layout>
          <Layout.Section>
            {/* Form Title Edit */}
            <Card>
              <InlineStack gap="400" blockAlign="center">
                <div style={{ flex: 1 }}>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Form title..."
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      background: "transparent",
                      color: "inherit",
                    }}
                  />
                </div>
                <Text as="p" variant="bodySm" tone="subdued">
                  {form.fields.length} fields · {form.conditions.length} conditions
                </Text>
              </InlineStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Tabs
              tabs={TABS}
              selected={activeTab}
              onSelect={setActiveTab}
            >
              {/* BUILD TAB */}
              {activeTab === 0 && (
                <div style={{ display: "flex", gap: 16, marginTop: 16, minHeight: 600 }}>
                  {/* Left: Field Palette */}
                  <div style={{ width: 220, flexShrink: 0 }}>
                    <FieldPalette onAddField={addField} currentStep={0} />
                  </div>

                  {/* Center: Canvas */}
                  <div style={{ flex: 1 }}>
                    <FormCanvas
                      fields={form.fields}
                      conditions={form.conditions}
                      selectedFieldId={selectedFieldId}
                      onSelectField={setSelectedFieldId}
                      onReorder={reorderFields}
                      onRemoveField={removeField}
                      onAddField={addField}
                    />
                  </div>

                  {/* Right: Field Settings */}
                  <div style={{ width: 280, flexShrink: 0 }}>
                    {selectedField ? (
                      <FieldSettings
                        field={selectedField}
                        onChange={updateField}
                        onDelete={() => removeField(selectedField.id)}
                      />
                    ) : (
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                            Select a field to edit its properties
                          </Text>
                        </BlockStack>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* LOGIC TAB */}
              {activeTab === 1 && (
                <div style={{ marginTop: 16 }}>
                  <LogicBuilder
                    fields={form.fields}
                    conditions={form.conditions}
                    onChange={updateConditions}
                  />
                </div>
              )}

              {/* STYLE TAB */}
              {activeTab === 2 && (
                <div style={{ marginTop: 16 }}>
                  <StyleEditor
                    style={form.style}
                    onChange={(style) => setForm((f) => ({ ...f, style }))}
                    onDetectTheme={handleDetectTheme}
                  />
                </div>
              )}

              {/* PREVIEW TAB */}
              {activeTab === 3 && (
                <div style={{ marginTop: 16 }}>
                  <FormPreview form={form} />
                </div>
              )}
            </Tabs>
          </Layout.Section>
        </Layout>

        {/* Toast */}
        {toast && (
          <Toast
            content={toast.message}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}
