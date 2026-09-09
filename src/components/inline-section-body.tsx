"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { SectionToolbar } from "@/components/rich-text-toolbar";
import { saveSectionHtml } from "@/lib/proposals/generate-actions";
import { cn } from "@/lib/utils";

export function InlineSectionBody({
  proposalId,
  section,
}: {
  proposalId: string;
  section: { id: string; key: string; htmlContent: string };
}) {
  const [savedHtml, setSavedHtml] = useState(section.htmlContent || "<p></p>");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editor = useEditor({
    extensions: [StarterKit],
    content: savedHtml,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-koya max-w-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(editing);
    if (editing) editor?.commands.focus("end");
  }, [editing, editor]);

  function startEditing(e: MouseEvent) {
    if (editing) return;
    if ((e.target as HTMLElement).closest("a")) return;
    setError(null);
    setEditing(true);
  }

  function cancel() {
    editor?.commands.setContent(savedHtml, { emitUpdate: false });
    setError(null);
    setEditing(false);
  }

  function save() {
    if (!editor) return;
    setError(null);
    const html = editor.getHTML();
    startTransition(async () => {
      const result = await saveSectionHtml(proposalId, section.key, html);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedHtml(html);
      setEditing(false);
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {editing && (
        <div className="flex flex-wrap items-center gap-2">
          <SectionToolbar editor={editor} />
          <Button type="button" size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}>
            Cancel
          </Button>
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      )}
      <div
        onClick={startEditing}
        className={cn(
          "rounded-md transition",
          editing
            ? "border border-[var(--koya-line)] bg-white/80 px-4 py-3 shadow-sm"
            : "cursor-text hover:bg-black/[0.02]",
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
