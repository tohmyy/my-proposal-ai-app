"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveSectionHtml } from "@/lib/proposals/generate-actions";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  key: string;
  title: string;
  htmlContent: string;
};

export function SectionEditor({
  proposalId,
  sections,
}: {
  proposalId: string;
  sections: Section[];
}) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");
  const active = sections.find((s) => s.key === activeKey) ?? sections[0];
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: active?.htmlContent || "<p></p>",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "prose-koya min-h-[320px] max-w-none px-4 py-3 focus:outline-none",
        },
      },
    },
    [],
  );

  useEffect(() => {
    if (!editor || !active) return;
    editor.commands.setContent(active.htmlContent || "<p></p>", {
      emitUpdate: false,
    });
  }, [active?.id, editor]);

  function onSave() {
    if (!editor || !active) return;
    setMessage(null);
    setError(null);
    const html = editor.getHTML();
    startTransition(async () => {
      const result = await saveSectionHtml(proposalId, active.key, html);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Saved “${active.title}”.`);
    });
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-[var(--koya-muted)]">
        No sections yet. Generate the proposal from the hub first.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setActiveKey(section.key);
              setMessage(null);
              setError(null);
            }}
            className={cn(
              "block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition",
              section.key === active?.key
                ? "bg-[var(--koya-accent)] text-white"
                : "text-[var(--koya-ink-soft)] hover:bg-black/5",
            )}
          >
            {section.title}
          </button>
        ))}
      </nav>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            {active?.title}
          </h2>
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
            <Button type="button" onClick={onSave} disabled={pending || !editor}>
              {pending ? "Saving…" : "Save section"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--koya-line)] bg-white/80 shadow-sm">
          <EditorContent editor={editor} />
        </div>

        {message && (
          <p className="text-sm font-medium text-[var(--koya-accent)]">{message}</p>
        )}
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>
    </div>
  );
}

function ToolbarButton({
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
