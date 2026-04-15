import type { Condition } from "./form-engine";

// ============================================================
// Condition Engine — Evaluates show/hide logic rules
// ============================================================

/**
 * Evaluates a single condition against the current form values
 */
export function evaluateCondition(
  condition: Condition,
  formValues: Record<string, string | string[]>
): boolean {
  const sourceValue = formValues[condition.sourceFieldId];
  const compareValue = condition.value;

  // Normalize source value to string
  const sourceStr = Array.isArray(sourceValue)
    ? sourceValue.join(",")
    : (sourceValue ?? "");

  switch (condition.operator) {
    case "equals":
      return sourceStr.toLowerCase() === compareValue.toLowerCase();

    case "not_equals":
      return sourceStr.toLowerCase() !== compareValue.toLowerCase();

    case "contains":
      return sourceStr.toLowerCase().includes(compareValue.toLowerCase());

    case "not_contains":
      return !sourceStr.toLowerCase().includes(compareValue.toLowerCase());

    case "greater_than":
      return parseFloat(sourceStr) > parseFloat(compareValue);

    case "less_than":
      return parseFloat(sourceStr) < parseFloat(compareValue);

    case "is_empty":
      return sourceStr.trim() === "";

    case "is_not_empty":
      return sourceStr.trim() !== "";

    default:
      return true;
  }
}

/**
 * Given all conditions and current form values, returns:
 * - hiddenFieldIds: fields that should be hidden
 * - requiredFieldIds: fields that are conditionally required
 * - skipToStep: step number to jump to (or null)
 */
export function evaluateAllConditions(
  conditions: Condition[],
  formValues: Record<string, string | string[]>
): {
  hiddenFieldIds: Set<string>;
  requiredFieldIds: Set<string>;
  skipToStep: number | null;
} {
  const hiddenFieldIds = new Set<string>();
  const requiredFieldIds = new Set<string>();
  let skipToStep: number | null = null;

  for (const condition of conditions) {
    const met = evaluateCondition(condition, formValues);

    if (met) {
      switch (condition.action) {
        case "show":
          // Target is shown when condition is met (it's hidden by default)
          // Don't add to hidden
          break;
        case "hide":
          hiddenFieldIds.add(condition.targetFieldId);
          break;
        case "require":
          requiredFieldIds.add(condition.targetFieldId);
          break;
        case "skip_to_step":
          skipToStep = parseInt(condition.value, 10);
          break;
      }
    } else {
      // If a "show" condition is NOT met, the field should be hidden
      if (condition.action === "show") {
        hiddenFieldIds.add(condition.targetFieldId);
      }
    }
  }

  return { hiddenFieldIds, requiredFieldIds, skipToStep };
}

/**
 * Validate a single field value
 */
export function validateField(
  value: string | string[],
  required: boolean,
  validation?: Array<{ type: string; value: string | number; message: string }>
): string | null {
  const strValue = Array.isArray(value) ? value.join(",") : (value ?? "");

  if (required && strValue.trim() === "") {
    return "This field is required";
  }

  if (!validation || strValue.trim() === "") return null;

  for (const rule of validation) {
    switch (rule.type) {
      case "minLength":
        if (strValue.length < Number(rule.value)) return rule.message;
        break;
      case "maxLength":
        if (strValue.length > Number(rule.value)) return rule.message;
        break;
      case "min":
        if (parseFloat(strValue) < Number(rule.value)) return rule.message;
        break;
      case "max":
        if (parseFloat(strValue) > Number(rule.value)) return rule.message;
        break;
      case "pattern":
        if (!new RegExp(String(rule.value)).test(strValue)) return rule.message;
        break;
    }
  }

  return null;
}
