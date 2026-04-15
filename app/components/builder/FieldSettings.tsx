import { useState } from "react";
import {
  Card, Text, BlockStack, InlineStack, Button, Select, TextField,
  Checkbox, Divider, Badge, Box, Tag,
} from "@shopify/polaris";
import type { FormField, ValidationRule } from "../../lib/form-engine";

interface FieldSettingsProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
}

const GRID_OPTIONS = [
  { label: "Full Width", value: "full" },
  { label: "Half Width (1/2)", value: "half" },
  { label: "One-Third (1/3)", value: "third" },
  { label: "Two-Thirds (2/3)", value: "two-thirds" },
];

export function FieldSettings({ field, onChange, onDelete }: FieldSettingsProps) {
  const [newOption, setNewOption] = useState("");

  const update = (patch: Partial<FormField>) => onChange({ ...field, ...patch });

  const addOption = () => {
    if (!newOption.trim()) return;
    update({ options: [...(field.options || []), newOption.trim()] });
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    const opts = [...(field.options || [])];
    opts.splice(idx, 1);
    update({ options: opts });
  };

  const updateOption = (idx: number, val: string) => {
    const opts = [...(field.options || [])];
    opts[idx] = val;
    update({ options: opts });
  };

  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);
  const isLayout = ["heading", "paragraph", "divider"].includes(field.type);

  return (
    <Card padding="300">
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm" fontWeight="semibold">
            Field Settings
          </Text>
          <Button tone="critical" size="slim" onClick={onDelete} plain>
            🗑 Remove
          </Button>
        </InlineStack>

        <Divider />

        {/* Label */}
        <TextField
          label="Label"
          value={field.label}
          onChange={(v) => update({ label: v })}
          autoComplete="off"
        />

        {/* Placeholder — not for layout fields */}
        {!isLayout && (
          <TextField
            label="Placeholder"
            value={field.placeholder || ""}
            onChange={(v) => update({ placeholder: v })}
            autoComplete="off"
          />
        )}

        {/* Help Text */}
        {!isLayout && (
          <TextField
            label="Help text"
            value={field.helpText || ""}
            onChange={(v) => update({ helpText: v })}
            autoComplete="off"
            placeholder="Optional hint shown below the field"
          />
        )}

        {/* Required */}
        {!isLayout && (
          <Checkbox
            label="Required field"
            checked={field.required}
            onChange={(v) => update({ required: v })}
          />
        )}

        {/* Grid Width */}
        <Select
          label="Column width"
          options={GRID_OPTIONS}
          value={field.gridColumn || "full"}
          onChange={(v) => update({ gridColumn: v as FormField["gridColumn"] })}
        />

        {/* Options for select/radio/checkbox */}
        {hasOptions && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" fontWeight="semibold">Options</Text>
              {(field.options || []).map((opt, idx) => (
                <InlineStack key={idx} gap="200" blockAlign="center">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label=""
                      value={opt}
                      onChange={(v) => updateOption(idx, v)}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    size="slim"
                    tone="critical"
                    plain
                    onClick={() => removeOption(idx)}
                  >×</Button>
                </InlineStack>
              ))}
              <InlineStack gap="200" blockAlign="center">
                <div style={{ flex: 1 }}>
                  <TextField
                    label=""
                    value={newOption}
                    onChange={setNewOption}
                    placeholder="Add option..."
                    autoComplete="off"
                    onKeyPress={(e) => { if (e.key === "Enter") addOption(); }}
                  />
                </div>
                <Button size="slim" onClick={addOption}>Add</Button>
              </InlineStack>
            </BlockStack>
          </>
        )}

        {/* File Upload Settings */}
        {field.type === "file" && (
          <>
            <Divider />
            <TextField
              label="Accepted file types"
              value={field.accept || ""}
              onChange={(v) => update({ accept: v })}
              placeholder=".pdf,.jpg,.png"
              helpText="Comma-separated extensions"
              autoComplete="off"
            />
            <TextField
              label="Max file size (MB)"
              type="number"
              value={String(field.maxFileSize || 5)}
              onChange={(v) => update({ maxFileSize: Number(v) })}
              autoComplete="off"
            />
          </>
        )}

        {/* Validation */}
        {!isLayout && field.type !== "file" && (
          <>
            <Divider />
            <Text as="p" variant="bodySm" fontWeight="semibold">Validation</Text>
            {(field.type === "text" || field.type === "textarea") && (
              <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Min length"
                    type="number"
                    value={String(
                      field.validation?.find((v) => v.type === "minLength")?.value || ""
                    )}
                    onChange={(v) => {
                      const rules = (field.validation || []).filter(
                        (r) => r.type !== "minLength"
                      );
                      if (v) rules.push({ type: "minLength", value: Number(v), message: `Minimum ${v} characters required` });
                      update({ validation: rules });
                    }}
                    autoComplete="off"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Max length"
                    type="number"
                    value={String(
                      field.validation?.find((v) => v.type === "maxLength")?.value || ""
                    )}
                    onChange={(v) => {
                      const rules = (field.validation || []).filter(
                        (r) => r.type !== "maxLength"
                      );
                      if (v) rules.push({ type: "maxLength", value: Number(v), message: `Maximum ${v} characters allowed` });
                      update({ validation: rules });
                    }}
                    autoComplete="off"
                  />
                </div>
              </InlineStack>
            )}
            {field.type === "number" && (
              <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Min value"
                    type="number"
                    value={String(field.validation?.find((v) => v.type === "min")?.value || "")}
                    onChange={(v) => {
                      const rules = (field.validation || []).filter((r) => r.type !== "min");
                      if (v) rules.push({ type: "min", value: Number(v), message: `Minimum value is ${v}` });
                      update({ validation: rules });
                    }}
                    autoComplete="off"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Max value"
                    type="number"
                    value={String(field.validation?.find((v) => v.type === "max")?.value || "")}
                    onChange={(v) => {
                      const rules = (field.validation || []).filter((r) => r.type !== "max");
                      if (v) rules.push({ type: "max", value: Number(v), message: `Maximum value is ${v}` });
                      update({ validation: rules });
                    }}
                    autoComplete="off"
                  />
                </div>
              </InlineStack>
            )}
          </>
        )}
      </BlockStack>
    </Card>
  );
}
