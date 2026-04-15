// ============================================================
// MakeFast Form Engine — Core Types & Utilities
// ============================================================

/** All supported field types in the form builder */
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "file"
  | "rating"
  | "heading"
  | "paragraph"
  | "divider"
  | "hidden";

/** Validation rule for a form field */
export interface ValidationRule {
  type: "min" | "max" | "minLength" | "maxLength" | "pattern" | "custom";
  value: string | number;
  message: string;
}

/** Single form field configuration */
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  gridColumn?: "full" | "half" | "third" | "two-thirds";
  options?: string[]; // For select, radio, checkbox
  defaultValue?: string;
  validation?: ValidationRule[];
  step?: number; // Which step this field belongs to (multi-step)
  accept?: string; // For file inputs (e.g., ".pdf,.jpg")
  maxFileSize?: number; // In MB
}

/** Conditional logic operators */
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

/** Action to take when a condition is met */
export type ConditionAction = "show" | "hide" | "require" | "skip_to_step";

/** A single conditional logic rule */
export interface Condition {
  id: string;
  sourceFieldId: string;
  operator: ConditionOperator;
  value: string;
  targetFieldId: string;
  action: ConditionAction;
}

/** Multi-step configuration */
export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  order: number;
}

/** Form styling configuration */
export interface FormStyle {
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  borderRadius: number; // px
  fieldSpacing: number; // px
  shadowIntensity: "none" | "light" | "medium" | "heavy";
  customCSS?: string;
}

/** Form-level settings */
export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  emailNotification: boolean;
  notificationEmail?: string;
  honeypotEnabled: boolean;
  multiStep: boolean;
  showProgressBar: boolean;
  submitAction: "message" | "redirect" | "close";
}

/** Complete form configuration */
export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  fields: FormField[];
  conditions: Condition[];
  steps: StepConfig[];
  settings: FormSettings;
  style: FormStyle;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Utility Functions
// ============================================================

/** Generate a unique ID */
export function generateId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

/** Create a blank new form */
export function createBlankForm(): FormConfig {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: "Untitled Form",
    description: "",
    status: "draft",
    fields: [],
    conditions: [],
    steps: [{ id: generateId(), title: "Step 1", order: 0 }],
    settings: {
      submitButtonText: "Submit",
      successMessage: "Thank you! Your response has been recorded.",
      emailNotification: true,
      honeypotEnabled: true,
      multiStep: false,
      showProgressBar: true,
      submitAction: "message",
    },
    style: {
      fontFamily: "Inter, sans-serif",
      backgroundColor: "#ffffff",
      textColor: "#1a1a2e",
      accentColor: "#6c5ce7",
      buttonColor: "#6c5ce7",
      buttonTextColor: "#ffffff",
      borderColor: "#e0e0e0",
      borderRadius: 8,
      fieldSpacing: 16,
      shadowIntensity: "light",
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Create a default field of a given type */
export function createDefaultField(type: FieldType): FormField {
  const base: FormField = {
    id: generateId(),
    type,
    label: getDefaultLabel(type),
    placeholder: "",
    required: false,
    gridColumn: "full",
    step: 0,
  };

  // Add type-specific defaults
  switch (type) {
    case "select":
    case "radio":
    case "checkbox":
      base.options = ["Option 1", "Option 2", "Option 3"];
      break;
    case "email":
      base.placeholder = "your@email.com";
      base.validation = [
        { type: "pattern", value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: "Please enter a valid email" },
      ];
      break;
    case "phone":
      base.placeholder = "+1 (555) 000-0000";
      break;
    case "textarea":
      base.placeholder = "Type your message here...";
      break;
    case "file":
      base.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
      base.maxFileSize = 5;
      break;
    case "rating":
      base.options = ["1", "2", "3", "4", "5"];
      break;
    case "heading":
      base.label = "Section Heading";
      break;
    case "paragraph":
      base.label = "Add description text here.";
      break;
  }

  return base;
}

/** Get a friendly default label for a field type */
function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: "Text Field",
    email: "Email Address",
    phone: "Phone Number",
    textarea: "Message",
    number: "Number",
    date: "Date",
    select: "Dropdown",
    radio: "Single Choice",
    checkbox: "Multiple Choice",
    file: "File Upload",
    rating: "Rating",
    heading: "Section Heading",
    paragraph: "Description",
    divider: "Divider",
    hidden: "Hidden Field",
  };
  return labels[type] || "Field";
}

/** Field type metadata for the palette */
export const FIELD_TYPE_META: Record<
  FieldType,
  { icon: string; label: string; category: "basic" | "choice" | "media" | "layout" | "advanced" }
> = {
  text: { icon: "TextBlockMajor", label: "Text", category: "basic" },
  email: { icon: "EmailMajor", label: "Email", category: "basic" },
  phone: { icon: "PhoneMajor", label: "Phone", category: "basic" },
  textarea: { icon: "TextAlignmentLeftMajor", label: "Long Text", category: "basic" },
  number: { icon: "HashtagMajor", label: "Number", category: "basic" },
  date: { icon: "CalendarMajor", label: "Date", category: "basic" },
  select: { icon: "SelectMinor", label: "Dropdown", category: "choice" },
  radio: { icon: "CircleTickMajor", label: "Single Choice", category: "choice" },
  checkbox: { icon: "CheckboxMajor", label: "Multi Choice", category: "choice" },
  file: { icon: "AttachmentMajor", label: "File Upload", category: "media" },
  rating: { icon: "StarFilledMinor", label: "Star Rating", category: "media" },
  heading: { icon: "TitleMinor", label: "Heading", category: "layout" },
  paragraph: { icon: "TextBlockMajor", label: "Paragraph", category: "layout" },
  divider: { icon: "MinusMinor", label: "Divider", category: "layout" },
  hidden: { icon: "HideMinor", label: "Hidden Field", category: "advanced" },
};
