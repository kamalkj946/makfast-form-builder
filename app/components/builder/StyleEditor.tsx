import { useState } from "react";
import {
  Card, Text, BlockStack, InlineStack, Button, TextField,
  RangeSlider, Select, Divider, Box, ColorPicker, Popover,
  hsbToHex, hexToRgb, rgbToHsb,
} from "@shopify/polaris";
import type { FormStyle } from "../../lib/form-engine";

interface StyleEditorProps {
  style: FormStyle;
  onChange: (style: FormStyle) => void;
  onDetectTheme: () => void;
}

const FONT_OPTIONS = [
  { label: "Inter (Recommended)", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Outfit", value: "Outfit, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "System Default", value: "-apple-system, BlinkMacSystemFont, sans-serif" },
];

const SHADOW_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Light", value: "light" },
  { label: "Medium", value: "medium" },
  { label: "Heavy", value: "heavy" },
];

// Simple hex color picker using a native input (no heavy dep)
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label style={{ fontSize: 13, color: "#374151", flex: 1 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: value,
            border: "2px solid #e5e7eb",
            cursor: "pointer",
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 80,
            height: 28,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "0 4px",
            fontSize: 12,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}

export function StyleEditor({ style, onChange, onDetectTheme }: StyleEditorProps) {
  const update = (patch: Partial<FormStyle>) => onChange({ ...style, ...patch });

  return (
    <BlockStack gap="400">
      {/* Auto-detect Banner */}
      <Card>
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" fontWeight="semibold">🎨 Auto-Match Your Theme</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Detect your store's colors and fonts automatically.
            </Text>
          </BlockStack>
          <Button onClick={onDetectTheme} variant="primary" size="slim">
            Detect Theme →
          </Button>
        </InlineStack>
      </Card>

      {/* Typography */}
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Typography</Text>
          <Select
            label="Font family"
            options={FONT_OPTIONS}
            value={style.fontFamily}
            onChange={(v) => update({ fontFamily: v })}
          />
        </BlockStack>
      </Card>

      {/* Colors */}
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Colors</Text>
          <ColorInput
            label="Background"
            value={style.backgroundColor}
            onChange={(v) => update({ backgroundColor: v })}
          />
          <ColorInput
            label="Text"
            value={style.textColor}
            onChange={(v) => update({ textColor: v })}
          />
          <ColorInput
            label="Accent / Focus"
            value={style.accentColor}
            onChange={(v) => update({ accentColor: v })}
          />
          <ColorInput
            label="Button Background"
            value={style.buttonColor}
            onChange={(v) => update({ buttonColor: v })}
          />
          <ColorInput
            label="Button Text"
            value={style.buttonTextColor}
            onChange={(v) => update({ buttonTextColor: v })}
          />
          <ColorInput
            label="Border"
            value={style.borderColor}
            onChange={(v) => update({ borderColor: v })}
          />
        </BlockStack>
      </Card>

      {/* Shape & Spacing */}
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Shape & Spacing</Text>
          <BlockStack gap="100">
            <Text as="p" variant="bodySm">Border radius: {style.borderRadius}px</Text>
            <RangeSlider
              label="Border radius"
              labelHidden
              min={0}
              max={24}
              value={style.borderRadius}
              onChange={(v) => update({ borderRadius: Number(v) })}
              output
            />
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodySm">Field spacing: {style.fieldSpacing}px</Text>
            <RangeSlider
              label="Field spacing"
              labelHidden
              min={8}
              max={40}
              value={style.fieldSpacing}
              onChange={(v) => update({ fieldSpacing: Number(v) })}
              output
            />
          </BlockStack>
          <Select
            label="Shadow intensity"
            options={SHADOW_OPTIONS}
            value={style.shadowIntensity}
            onChange={(v) => update({ shadowIntensity: v as FormStyle["shadowIntensity"] })}
          />
        </BlockStack>
      </Card>

      {/* Custom CSS */}
      <Card>
        <BlockStack gap="300">
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm" fontWeight="semibold">Custom CSS</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              For power users. Target <code>.mf-form</code> and <code>.mf-field</code> classes.
            </Text>
          </BlockStack>
          <TextField
            label="Custom CSS"
            labelHidden
            multiline={8}
            value={style.customCSS || ""}
            onChange={(v) => update({ customCSS: v })}
            placeholder={`.mf-form {\n  /* Your custom styles */\n}\n\n.mf-btn-submit {\n  /* Custom button styles */\n}`}
            monospaced
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      {/* Live Preview Swatch */}
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Style Preview</Text>
          <div
            style={{
              background: style.backgroundColor,
              borderRadius: style.borderRadius,
              padding: 20,
              border: `1px solid ${style.borderColor}`,
              fontFamily: style.fontFamily,
            }}
          >
            <p style={{ color: style.textColor, margin: "0 0 8px", fontWeight: 600, fontSize: 14 }}>
              Sample Field Label *
            </p>
            <input
              readOnly
              value="Sample input value"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: style.borderRadius,
                border: `1.5px solid ${style.accentColor}`,
                color: style.textColor,
                background: style.backgroundColor,
                fontFamily: style.fontFamily,
                fontSize: 14,
                outlineColor: style.accentColor,
                boxSizing: "border-box",
              }}
            />
            <button
              style={{
                marginTop: 12,
                background: style.buttonColor,
                color: style.buttonTextColor,
                border: "none",
                borderRadius: style.borderRadius,
                padding: "10px 24px",
                fontFamily: style.fontFamily,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                boxShadow:
                  style.shadowIntensity === "none" ? "none"
                  : style.shadowIntensity === "light" ? "0 2px 8px rgba(0,0,0,0.12)"
                  : style.shadowIntensity === "medium" ? "0 4px 16px rgba(0,0,0,0.18)"
                  : "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              Submit Form
            </button>
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
