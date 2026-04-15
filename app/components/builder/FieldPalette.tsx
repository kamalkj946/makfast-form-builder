import { Card, Text, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import type { FieldType, FormField } from "../../lib/form-engine";
import { createDefaultField, FIELD_TYPE_META } from "../../lib/form-engine";

interface FieldPaletteProps {
  onAddField: (field: FormField) => void;
  currentStep?: number;
}

const CATEGORIES = [
  { id: "basic", label: "Basic Fields", emoji: "📝" },
  { id: "choice", label: "Choice Fields", emoji: "☑️" },
  { id: "media", label: "Media & Rating", emoji: "📎" },
  { id: "layout", label: "Layout", emoji: "📐" },
  { id: "advanced", label: "Advanced", emoji: "⚙️" },
] as const;

export function FieldPalette({ onAddField, currentStep = 0 }: FieldPaletteProps) {
  const handleAdd = (type: FieldType) => {
    const field = createDefaultField(type);
    field.step = currentStep;
    onAddField(field);
  };

  return (
    <Card padding="300">
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm" fontWeight="semibold">
          Fields
        </Text>

        {CATEGORIES.map((cat) => {
          const fields = Object.entries(FIELD_TYPE_META).filter(
            ([, meta]) => meta.category === cat.id
          );

          return (
            <BlockStack key={cat.id} gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                {cat.emoji} {cat.label}
              </Text>
              <BlockStack gap="100">
                {fields.map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => handleAdd(type as FieldType)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1.5px dashed #c4b5fd",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: "#374151",
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f3f0ff";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed";
                      (e.currentTarget as HTMLButtonElement).style.color = "#6c5ce7";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4b5fd";
                      (e.currentTarget as HTMLButtonElement).style.color = "#374151";
                    }}
                  >
                    <span style={{ fontSize: 14 }}>+</span>
                    <span>{meta.label}</span>
                  </button>
                ))}
              </BlockStack>
            </BlockStack>
          );
        })}
      </BlockStack>
    </Card>
  );
}
