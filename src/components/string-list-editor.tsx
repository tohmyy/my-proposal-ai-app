"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StringListEditor({
  label,
  name,
  items,
  onChange,
  placeholder = "Add an item…",
  hard,
}: {
  label: string;
  name: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  hard?: boolean;
}) {
  const rows = items.length > 0 ? items : [""];

  function updateAt(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function removeAt(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : [""]);
  }

  function addRow() {
    onChange([...rows, ""]);
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {hard && (
          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--koya-accent)]">
            required for generate
          </span>
        )}
      </Label>
      <input type="hidden" name={name} value={JSON.stringify(items.filter((i) => i.trim()))} />
      <ul className="space-y-2">
        {rows.map((item, index) => (
          <li key={index} className="flex gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateAt(index, e.target.value)}
              aria-label={`${label} ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 px-2"
              onClick={() => removeAt(index)}
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}
