import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Text, BlockStack, InlineStack, Button, Badge, Box } from "@shopify/polaris";
import type { FormField, Condition } from "../../lib/form-engine";

interface FormCanvasProps {
  fields: FormField[];
  conditions: Condition[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onReorder: (fields: FormField[]) => void;
  onRemoveField: (id: string) => void;
  onAddField: (field: FormField) => void;
}

// ─── Sortable Field Item ──────────────────────────────────────────────────────
interface SortableItemProps {
  field: FormField;
  isSelected: boolean;
  hasCondition: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableItem({ field, isSelected, hasCondition, onSelect, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const gridWidth: Record<string, string> = {
    full: "100%",
    half: "calc(50% - 8px)",
    third: "calc(33.333% - 11px)",
    "two-thirds": "calc(66.666% - 5px)",
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: gridWidth[field.gridColumn || "full"],
        marginBottom: 8,
      }}
    >
      <div
        onClick={onSelect}
        style={{
          border: `2px solid ${isSelected ? "#6c5ce7" : "#e5e7eb"}`,
          borderRadius: 10,
          padding: "10px 12px",
          background: isSelected ? "#f3f0ff" : "#fff",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: isSelected ? "0 0 0 3px rgba(108,92,231,0.15)" : "none",
          position: "relative",
        }}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "grab",
            padding: "4px 2px",
            color: "#9ca3af",
            fontSize: 16,
            lineHeight: 1,
          }}
          title="Drag to reorder"
        >
          ⣿
        </div>

        <div style={{ marginLeft: 24, marginRight: 36 }}>
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" variant="bodySm" tone="subdued">
              {getFieldEmoji(field.type)}
            </Text>
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {field.label}
            </Text>
            {field.required && (
              <Badge tone="attention" size="small">Required</Badge>
            )}
            {hasCondition && (
              <Badge tone="magic" size="small">⚡ Logic</Badge>
            )}
          </InlineStack>

          <Text as="p" variant="bodySm" tone="subdued" truncate>
            {field.type === "select" || field.type === "radio" || field.type === "checkbox"
              ? `${field.options?.length || 0} options`
              : field.placeholder || getFieldHint(field.type)}
          </Text>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: 18,
            padding: 4,
            borderRadius: 4,
            lineHeight: 1,
          }}
          title="Remove field"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────
export function FormCanvas({
  fields,
  conditions,
  selectedFieldId,
  onSelectField,
  onReorder,
  onRemoveField,
}: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const conditionedFieldIds = new Set([
    ...conditions.map((c) => c.sourceFieldId),
    ...conditions.map((c) => c.targetFieldId),
  ]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = fields.findIndex((f) => f.id === active.id);
      const newIdx = fields.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(fields, oldIdx, newIdx));
    }
  }

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm">Form Canvas</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Drag to reorder · Click to edit
          </Text>
        </InlineStack>

        <div
          style={{
            minHeight: 400,
            border: "2px dashed #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fafafa",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectField(null);
          }}
        >
          {fields.length === 0 ? (
            <div style={{
              height: 360,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#9ca3af",
            }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <Text as="p" variant="bodyMd" tone="subdued">
                Add fields from the palette on the left
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                or click "🤖 Generate with AI" to build instantly
              </Text>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {fields.map((field) => (
                    <SortableItem
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      hasCondition={conditionedFieldIds.has(field.id)}
                      onSelect={() => onSelectField(field.id)}
                      onRemove={() => onRemoveField(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {fields.length > 0 && (
          <Text as="p" variant="bodySm" tone="subdued" alignment="center">
            {fields.length} field{fields.length !== 1 ? "s" : ""} ·{" "}
            {conditions.length} condition{conditions.length !== 1 ? "s" : ""}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

function getFieldEmoji(type: string): string {
  const map: Record<string, string> = {
    text: "📝", email: "📧", phone: "📞", textarea: "💬",
    number: "#️⃣", date: "📅", select: "🔽", radio: "🔘",
    checkbox: "☑️", file: "📎", rating: "⭐", heading: "📌",
    paragraph: "📄", divider: "➖", hidden: "👁️",
  };
  return map[type] || "📝";
}

function getFieldHint(type: string): string {
  const hints: Record<string, string> = {
    text: "Short text input", email: "Email address",
    phone: "Phone number", textarea: "Long text area",
    number: "Numeric input", date: "Date picker",
    select: "Dropdown selection", radio: "Single choice",
    checkbox: "Multiple choice", file: "File upload",
    rating: "Star rating", heading: "Section heading",
    paragraph: "Static text", divider: "Visual separator",
    hidden: "Hidden value",
  };
  return hints[type] || "";
}
