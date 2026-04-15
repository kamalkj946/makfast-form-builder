import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FormConfig } from "./form-engine";
import { createBlankForm, generateId } from "./form-engine";

// ============================================================
// Gemini AI — Prompt-to-Form Generator
// Uses Google Gemini Free Tier
// ============================================================

const SYSTEM_PROMPT = `You are MakeFast AI, a form builder assistant. When a user describes a form they need, you generate a JSON configuration for it.

RULES:
1. Return ONLY valid JSON, no markdown or explanation.
2. Use these field types: text, email, phone, textarea, number, date, select, radio, checkbox, file, rating, heading, paragraph, divider, hidden
3. Use gridColumn: "full", "half", "third", or "two-thirds"
4. Set sensible validation rules
5. Add conditional logic when it makes sense (e.g., "Other" option showing a text field)
6. Create multi-step forms when the form has 6+ fields
7. Use professional, clear labels

OUTPUT FORMAT:
{
  "title": "Form Title",
  "description": "Brief description",
  "fields": [
    {
      "type": "text",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true/false,
      "gridColumn": "full",
      "options": ["opt1", "opt2"],
      "step": 0,
      "validation": [{"type": "minLength", "value": 2, "message": "Too short"}]
    }
  ],
  "conditions": [
    {
      "sourceFieldId": "FIELD_INDEX_0",
      "operator": "equals",
      "value": "Other",
      "targetFieldId": "FIELD_INDEX_1",
      "action": "show"
    }
  ],
  "steps": [
    {"title": "Step Title", "order": 0}
  ],
  "settings": {
    "submitButtonText": "Submit",
    "successMessage": "Thank you!",
    "multiStep": false,
    "showProgressBar": true
  }
}

For conditions, use FIELD_INDEX_N to reference the Nth field (0-based). Real IDs will be assigned later.`;

/**
 * Generate a form configuration from a natural language prompt
 */
export async function generateFormFromPrompt(
  prompt: string,
  apiKey?: string
): Promise<FormConfig> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Create a form for: ${prompt}` },
  ]);

  const responseText = result.response.text();
  let parsed: any;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI returned invalid JSON");
    }
  }

  // Convert AI output to a proper FormConfig
  return aiOutputToFormConfig(parsed);
}

/**
 * Convert the AI's raw output to a proper FormConfig with real IDs
 */
function aiOutputToFormConfig(raw: any): FormConfig {
  const form = createBlankForm();

  form.title = raw.title || "AI Generated Form";
  form.description = raw.description || "";

  // Generate real IDs for fields
  const fieldIdMap: Record<string, string> = {};
  form.fields = (raw.fields || []).map((f: any, index: number) => {
    const id = generateId();
    fieldIdMap[`FIELD_INDEX_${index}`] = id;
    return {
      id,
      type: f.type || "text",
      label: f.label || `Field ${index + 1}`,
      placeholder: f.placeholder || "",
      helpText: f.helpText || "",
      required: f.required ?? false,
      gridColumn: f.gridColumn || "full",
      options: f.options,
      defaultValue: f.defaultValue,
      validation: f.validation,
      step: f.step ?? 0,
      accept: f.accept,
      maxFileSize: f.maxFileSize,
    };
  });

  // Map condition references to real IDs
  form.conditions = (raw.conditions || []).map((c: any) => ({
    id: generateId(),
    sourceFieldId: fieldIdMap[c.sourceFieldId] || c.sourceFieldId,
    operator: c.operator || "equals",
    value: c.value || "",
    targetFieldId: fieldIdMap[c.targetFieldId] || c.targetFieldId,
    action: c.action || "show",
  }));

  // Steps
  if (raw.steps && raw.steps.length > 0) {
    form.steps = raw.steps.map((s: any, i: number) => ({
      id: generateId(),
      title: s.title || `Step ${i + 1}`,
      description: s.description || "",
      order: s.order ?? i,
    }));
  }

  // Settings
  if (raw.settings) {
    form.settings = {
      ...form.settings,
      submitButtonText: raw.settings.submitButtonText || "Submit",
      successMessage: raw.settings.successMessage || "Thank you!",
      multiStep: raw.settings.multiStep ?? form.fields.length > 5,
      showProgressBar: raw.settings.showProgressBar ?? true,
    };
  }

  return form;
}
