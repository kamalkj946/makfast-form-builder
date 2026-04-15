import { useState, useCallback } from "react";
import {
  Modal, Text, TextField, Button, BlockStack, InlineStack,
  Spinner, Icon, Banner,
} from "@shopify/polaris";
import { WandMajor } from "@shopify/polaris-icons";
import type { FormConfig } from "../../lib/form-engine";
import { useFetcher } from "@remix-run/react";

interface AIPromptModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (form: FormConfig) => void;
}

const EXAMPLE_PROMPTS = [
  "Return request form for a clothing brand",
  "Wholesale registration form with company info and VAT number",
  "Customer feedback survey with star ratings",
  "Job application form for a marketing role",
  "Event registration form with dietary preferences",
  "Product customization form with engraving text",
];

export function AIPromptModal({ open, onClose, onApply }: AIPromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<FormConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher<{ generatedForm?: FormConfig; error?: string }>();

  const isLoading = fetcher.state !== "idle";

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setGenerated(null);

    const fd = new FormData();
    fd.append("intent", "ai_generate");
    fd.append("prompt", prompt);
    fetcher.submit(fd, { method: "POST" });
  }, [prompt, fetcher]);

  // Watch fetcher result
  if (fetcher.data && !isLoading) {
    if (fetcher.data.generatedForm && !generated) {
      setGenerated(fetcher.data.generatedForm);
    }
    if (fetcher.data.error && !error) {
      setError(fetcher.data.error);
    }
  }

  const handleApply = () => {
    if (generated) {
      onApply(generated);
      setPrompt("");
      setGenerated(null);
      setError(null);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setGenerated(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="🤖 Generate Form with AI"
      primaryAction={
        generated
          ? { content: "✅ Apply to Canvas", onAction: handleApply }
          : { content: "Generate →", onAction: handleGenerate, loading: isLoading, disabled: !prompt.trim() }
      }
      secondaryActions={[{ content: "Cancel", onAction: handleClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd" tone="subdued">
            Describe the form you need in plain English. Our AI will build it instantly using Gemini.
          </Text>

          <TextField
            label="Describe your form"
            value={prompt}
            onChange={setPrompt}
            multiline={3}
            placeholder="e.g. A return request form for a clothing brand with order number, reason for return, and photo upload..."
            autoComplete="off"
            disabled={isLoading}
          />

          {/* Example prompts */}
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" tone="subdued">Try an example:</Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  disabled={isLoading}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 100,
                    border: "1.5px solid #c4b5fd",
                    background: "transparent",
                    color: "#6c5ce7",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f3f0ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </BlockStack>

          {/* Loading state */}
          {isLoading && (
            <InlineStack gap="300" blockAlign="center">
              <Spinner size="small" />
              <Text as="p" variant="bodySm" tone="subdued">
                AI is building your form...
              </Text>
            </InlineStack>
          )}

          {/* Error */}
          {error && (
            <Banner tone="critical" title="Generation failed">
              <p>{error}</p>
            </Banner>
          )}

          {/* Success preview */}
          {generated && (
            <Banner tone="success" title={`✅ "${generated.title}" is ready!`}>
              <p>
                {generated.fields.length} fields · {generated.conditions.length} conditions ·{" "}
                {generated.steps.length} step{generated.steps.length !== 1 ? "s" : ""}
              </p>
              <BlockStack gap="100">
                {generated.fields.slice(0, 5).map((f) => (
                  <Text key={f.id} as="p" variant="bodySm">
                    • {f.label} ({f.type}){f.required ? " *" : ""}
                  </Text>
                ))}
                {generated.fields.length > 5 && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    + {generated.fields.length - 5} more fields...
                  </Text>
                )}
              </BlockStack>
            </Banner>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
