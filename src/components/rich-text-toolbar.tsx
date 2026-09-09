"use client";

import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

export function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border px-3 text-xs font-semibold transition",
        active
          ? "border-[var(--koya-accent)] bg-teal-50 text-[var(--koya-accent)]"
          : "border-[var(--koya-line)] bg-white/70 text-[var(--koya-ink-soft)] hover:border-[var(--koya-ink)]",
      )}
    >
      {label}
    </button>
  );
}

export function SectionToolbar({ editor }: { editor: Editor | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarButton
        label="Bold"
        active={editor?.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        active={editor?.isActive("italic")}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="List"
        active={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered"
        active={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}
