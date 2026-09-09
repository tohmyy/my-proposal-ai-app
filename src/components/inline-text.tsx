"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatDateDisplay(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function InlineText({
  value,
  type = "text",
  placeholder,
  emptyLabel = "Click to add",
  className,
  inputClassName,
  onSave,
}: {
  value: string;
  type?: "text" | "date";
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  inputClassName?: string;
  onSave: (value: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [savedValue, setSavedValue] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEditing() {
    setDraft(savedValue);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setError(null);
    setEditing(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await onSave(draft.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedValue(draft.trim());
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 align-middle">
        <Input
          autoFocus
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className={cn("h-9 w-auto min-w-[10ch]", inputClassName)}
        />
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
        {error && <span className="text-sm text-rose-700">{error}</span>}
      </span>
    );
  }

  const display = type === "date" ? formatDateDisplay(savedValue) : savedValue;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === "Enter") startEditing();
      }}
      className={cn(
        "cursor-text rounded-sm decoration-dotted decoration-[var(--koya-accent)] underline-offset-4 hover:underline",
        !savedValue.trim() && "text-[var(--koya-muted)]",
        className,
      )}
    >
      {savedValue.trim() ? display : emptyLabel}
    </span>
  );
}
