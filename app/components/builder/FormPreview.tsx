import { useState } from "react";
import { Card, Text, BlockStack, InlineStack, Button, Badge } from "@shopify/polaris";
import type { FormConfig, FormField } from "../../lib/form-engine";
import { evaluateAllConditions } from "../../lib/condition-engine";

interface FormPreviewProps {
  form: FormConfig;
}

export function FormPreview({ form }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { hiddenFieldIds, requiredFieldIds } = evaluateAllConditions(form.conditions, values);

  const isMultiStep = form.settings.multiStep && form.steps.length > 1;
  const stepFields = form.fields.filter(
    (f) => !isMultiStep || (f.step ?? 0) === currentStep
  );
  const visibleFields = stepFields.filter((f) => !hiddenFieldIds.has(f.id));

  const setValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors((prev) => { const n = { ...prev }; delete n[fieldId]; return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMultiStep && currentStep < form.steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }
    setSubmitted(true);
  };

  const { style } = form;
  const shadowMap = {
    none: "none",
    light: "0 2px 12px rgba(0,0,0,0.08)",
    medium: "0 4px 20px rgba(0,0,0,0.14)",
    heavy: "0 8px 32px rgba(0,0,0,0.22)",
  };

  if (submitted) {
    return (
      <Card>
        <div style={{
          padding: "60px 40px",
          textAlign: "center",
          background: style.backgroundColor,
          borderRadius: style.borderRadius,
          fontFamily: style.fontFamily,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: style.textColor, margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
            {form.settings.successMessage}
          </h2>
          <Button onClick={() => { setSubmitted(false); setValues({}); setCurrentStep(0); }}>
            Reset Preview
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      <InlineStack align="space-between">
        <Text as="h2" variant="headingMd">Live Preview</Text>
        <InlineStack gap="200">
          <Badge>Preview Mode</Badge>
          <Button size="slim" onClick={() => { setValues({}); setCurrentStep(0); setErrors({}); }}>Reset</Button>
        </InlineStack>
      </InlineStack>

      <div style={{
        background: "#f3f4f6",
        borderRadius: 12,
        padding: 32,
      }}>
        {/* Multi-step progress */}
        {isMultiStep && (
          <div style={{ marginBottom: 24 }}>
            <InlineStack align="space-between">
              <Text as="p" variant="bodySm" tone="subdued">
                Step {currentStep + 1} of {form.steps.length}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {form.steps[currentStep]?.title}
              </Text>
            </InlineStack>
            <div style={{
              height: 4,
              background: "#e5e7eb",
              borderRadius: 4,
              marginTop: 8,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${((currentStep + 1) / form.steps.length) * 100}%`,
                background: style.accentColor,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: style.backgroundColor,
            borderRadius: style.borderRadius,
            padding: 28,
            fontFamily: style.fontFamily,
            boxShadow: shadowMap[style.shadowIntensity],
            border: `1px solid ${style.borderColor}`,
          }}
        >
          {visibleFields.length === 0 && (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>
              No visible fields on this step
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: style.fieldSpacing }}>
            {visibleFields.map((field) => (
              <div
                key={field.id}
                style={{
                  width: getWidth(field.gridColumn),
                  boxSizing: "border-box",
                }}
              >
                <RenderField
                  field={field}
                  value={values[field.id] || ""}
                  onChange={(v) => setValue(field.id, v)}
                  error={errors[field.id]}
                  required={field.required || requiredFieldIds.has(field.id)}
                  style={style}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            {isMultiStep && currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                style={{
                  padding: "10px 24px",
                  borderRadius: style.borderRadius,
                  border: `2px solid ${style.buttonColor}`,
                  background: "transparent",
                  color: style.buttonColor,
                  fontFamily: style.fontFamily,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              style={{
                padding: "11px 28px",
                borderRadius: style.borderRadius,
                border: "none",
                background: style.buttonColor,
                color: style.buttonTextColor,
                fontFamily: style.fontFamily,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
                boxShadow: shadowMap[style.shadowIntensity],
                transition: "opacity 0.15s",
              }}
            >
              {isMultiStep && currentStep < form.steps.length - 1
                ? "Next →"
                : form.settings.submitButtonText}
            </button>
          </div>
        </form>
      </div>

      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
        This is a live preview. Submissions here won't be saved.
      </Text>
    </BlockStack>
  );
}

function getWidth(col?: string): string {
  const map: Record<string, string> = {
    full: "100%",
    half: "calc(50% - 8px)",
    third: "calc(33.333% - 11px)",
    "two-thirds": "calc(66.666% - 5px)",
  };
  return map[col || "full"] || "100%";
}

function RenderField({
  field, value, onChange, error, required, style,
}: {
  field: FormField;
  value: any;
  onChange: (v: any) => void;
  error?: string;
  required: boolean;
  style: any;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: style.borderRadius,
    border: `1.5px solid ${error ? "#ef4444" : style.borderColor}`,
    color: style.textColor,
    fontFamily: style.fontFamily,
    fontSize: 14,
    background: style.backgroundColor,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: style.textColor,
    marginBottom: 6,
  };

  if (field.type === "heading") {
    return <h3 style={{ margin: "8px 0 4px", color: style.textColor, fontFamily: style.fontFamily, fontSize: 18, fontWeight: 700 }}>{field.label}</h3>;
  }
  if (field.type === "paragraph") {
    return <p style={{ margin: 0, color: style.textColor, fontFamily: style.fontFamily, fontSize: 14, opacity: 0.75 }}>{field.label}</p>;
  }
  if (field.type === "divider") {
    return <hr style={{ border: "none", borderTop: `1px solid ${style.borderColor}`, margin: "4px 0" }} />;
  }

  return (
    <div>
      <label style={labelStyle}>
        {field.label}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...inputStyle, resize: "vertical", height: "auto" }}
          required={required}
        />
      )}
      {(field.type === "select") && (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} required={required}>
          <option value="">{field.placeholder || "— Select —"}</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === "radio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {field.options?.map((o) => (
            <label key={o} style={{ ...labelStyle, fontWeight: 400, display: "flex", gap: 8, cursor: "pointer" }}>
              <input type="radio" name={field.id} value={o} checked={value === o} onChange={() => onChange(o)} required={required} />
              {o}
            </label>
          ))}
        </div>
      )}
      {field.type === "checkbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {field.options?.map((o) => (
            <label key={o} style={{ ...labelStyle, fontWeight: 400, display: "flex", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                value={o}
                checked={Array.isArray(value) && value.includes(o)}
                onChange={(e) => {
                  const arr = Array.isArray(value) ? [...value] : [];
                  e.target.checked ? arr.push(o) : arr.splice(arr.indexOf(o), 1);
                  onChange(arr);
                }}
              />
              {o}
            </label>
          ))}
        </div>
      )}
      {field.type === "rating" && (
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(String(star))}
              style={{
                fontSize: 28,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: Number(value) >= star ? "#f59e0b" : "#d1d5db",
                transition: "color 0.1s",
              }}
            >★</button>
          ))}
        </div>
      )}
      {!["textarea", "select", "radio", "checkbox", "rating", "file", "heading", "paragraph", "divider"].includes(field.type) && (
        <input
          type={field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={inputStyle}
          required={required}
        />
      )}
      {field.type === "file" && (
        <input type="file" accept={field.accept} style={{ ...inputStyle, padding: "7px 12px" }} />
      )}

      {field.helpText && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: style.textColor, opacity: 0.6 }}>{field.helpText}</p>
      )}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>
      )}
    </div>
  );
}
