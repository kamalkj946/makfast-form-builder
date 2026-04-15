import { useState } from "react";
import {
  Card, Text, BlockStack, InlineStack, Button, Select, TextField,
  Badge, Divider, EmptyState, Box,
} from "@shopify/polaris";
import type { FormField, Condition, ConditionOperator, ConditionAction } from "../../lib/form-engine";
import { generateId } from "../../lib/form-engine";

interface LogicBuilderProps {
  fields: FormField[];
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
}

const OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: "equals", value: "equals" },
  { label: "does not equal", value: "not_equals" },
  { label: "contains", value: "contains" },
  { label: "does not contain", value: "not_contains" },
  { label: "is greater than", value: "greater_than" },
  { label: "is less than", value: "less_than" },
  { label: "is empty", value: "is_empty" },
  { label: "is not empty", value: "is_not_empty" },
];

const ACTIONS: { label: string; value: ConditionAction }[] = [
  { label: "Show field", value: "show" },
  { label: "Hide field", value: "hide" },
  { label: "Make required", value: "require" },
];

export function LogicBuilder({ fields, conditions, onChange }: LogicBuilderProps) {
  const visibleFields = fields.filter(
    (f) => !["heading", "paragraph", "divider"].includes(f.type)
  );

  const fieldOptions = [
    { label: "— Select a field —", value: "" },
    ...visibleFields.map((f) => ({ label: f.label || f.type, value: f.id })),
  ];

  const addCondition = () => {
    if (visibleFields.length < 2) return;
    const newCond: Condition = {
      id: generateId(),
      sourceFieldId: visibleFields[0]?.id || "",
      operator: "equals",
      value: "",
      targetFieldId: visibleFields[1]?.id || "",
      action: "show",
    };
    onChange([...conditions, newCond]);
  };

  const updateCondition = (id: string, patch: Partial<Condition>) => {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id));
  };

  const needsValue = (op: ConditionOperator) =>
    !["is_empty", "is_not_empty"].includes(op);

  const getFieldOptions = (currentSourceId: string) =>
    visibleFields.map((f) => ({ label: f.label || f.type, value: f.id }));

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Conditional Logic</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Show, hide, or require fields based on what customers answer.
              </Text>
            </BlockStack>
            <Button
              variant="primary"
              onClick={addCondition}
              disabled={visibleFields.length < 2}
            >
              + Add Condition
            </Button>
          </InlineStack>

          {visibleFields.length < 2 && (
            <Box padding="400" background="bg-surface-caution" borderRadius="200">
              <Text as="p" variant="bodySm" tone="caution">
                ⚡ Add at least 2 fields to create conditions.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Card>

      {conditions.length === 0 && visibleFields.length >= 2 && (
        <Card>
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Text as="p" variant="bodyLg" tone="subdued">⚡ No conditions yet</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Click "Add Condition" to create show/hide logic between fields.
            </Text>
          </div>
        </Card>
      )}

      {conditions.map((cond, idx) => {
        const sourceField = fields.find((f) => f.id === cond.sourceFieldId);
        const targetField = fields.find((f) => f.id === cond.targetFieldId);
        const showValue = needsValue(cond.operator);

        // For select/radio/checkbox source, show option values
        const valueOptions =
          sourceField?.options?.length
            ? [
                { label: "— Enter value —", value: "" },
                ...sourceField.options.map((o) => ({ label: o, value: o })),
              ]
            : null;

        return (
          <Card key={cond.id}>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Badge tone="magic">Rule {idx + 1}</Badge>
                <Button
                  size="slim"
                  tone="critical"
                  plain
                  onClick={() => removeCondition(cond.id)}
                >
                  Remove
                </Button>
              </InlineStack>

              <Divider />

              {/* IF row */}
              <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">IF</Text>
              <InlineStack gap="300" wrap>
                <div style={{ flex: "2 1 140px" }}>
                  <Select
                    label="Source field"
                    labelHidden
                    options={fieldOptions}
                    value={cond.sourceFieldId}
                    onChange={(v) => updateCondition(cond.id, { sourceFieldId: v })}
                  />
                </div>
                <div style={{ flex: "2 1 140px" }}>
                  <Select
                    label="Operator"
                    labelHidden
                    options={OPERATORS}
                    value={cond.operator}
                    onChange={(v) =>
                      updateCondition(cond.id, { operator: v as ConditionOperator })
                    }
                  />
                </div>
                {showValue && (
                  <div style={{ flex: "2 1 140px" }}>
                    {valueOptions ? (
                      <Select
                        label="Value"
                        labelHidden
                        options={valueOptions}
                        value={cond.value}
                        onChange={(v) => updateCondition(cond.id, { value: v })}
                      />
                    ) : (
                      <TextField
                        label="Value"
                        labelHidden
                        value={cond.value}
                        onChange={(v) => updateCondition(cond.id, { value: v })}
                        placeholder="Value..."
                        autoComplete="off"
                      />
                    )}
                  </div>
                )}
              </InlineStack>

              {/* THEN row */}
              <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">THEN</Text>
              <InlineStack gap="300" wrap>
                <div style={{ flex: "2 1 140px" }}>
                  <Select
                    label="Action"
                    labelHidden
                    options={ACTIONS}
                    value={cond.action}
                    onChange={(v) =>
                      updateCondition(cond.id, { action: v as ConditionAction })
                    }
                  />
                </div>
                <div style={{ flex: "2 1 140px" }}>
                  <Select
                    label="Target field"
                    labelHidden
                    options={fieldOptions}
                    value={cond.targetFieldId}
                    onChange={(v) => updateCondition(cond.id, { targetFieldId: v })}
                  />
                </div>
              </InlineStack>

              {/* Summary pill */}
              <Box
                padding="200"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text as="p" variant="bodySm" tone="subdued">
                  📖{" "}
                  <strong>If</strong> "{sourceField?.label || "?"}" {cond.operator.replace(/_/g, " ")}{" "}
                  {showValue && cond.value ? `"${cond.value}"` : ""}{" "}
                  → <strong>{cond.action}</strong> "{targetField?.label || "?"}"
                </Text>
              </Box>
            </BlockStack>
          </Card>
        );
      })}
    </BlockStack>
  );
}
