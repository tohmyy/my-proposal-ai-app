"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useInlineEditSlot } from "@/components/inline-edit-context";
import { localTodayIsoDate } from "@/lib/proposals/types";
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
  id,
  value,
  type = "text",
  placeholder,
  emptyLabel = "Click to add",
  className,
  inputClassName,
  onSave,
}: {
  id: string;
  value: string;
  type?: "text" | "date";
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  inputClassName?: string;
  onSave: (value: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [savedValue, setSavedValue] = useState(value);
  const { isActive: editing, open, close, ref } = useInlineEditSlot<HTMLSpanElement>(id);
  const [draft, setDraft] = useState(value);
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function startEditing() {
    setDraft(savedValue);
    open();
  }

  function cancel() {
    close();
  }

  function save() {
    startTransition(async () => {
      const result = await onSave(draft.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedValue(draft.trim());
      close();
    });
  }

  if (editing) {
    return (
      <span ref={ref} className="inline-flex flex-wrap items-center gap-2 align-middle">
        <Input
          autoFocus
          type={type}
          value={draft}
          max={type === "date" ? localTodayIsoDate() : undefined}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className={cn("h-9 w-auto min-w-[10ch]", inputClassName)}
        />
        <Button type="button" size="sm" onClick={save} loading={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
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
