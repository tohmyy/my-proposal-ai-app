"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { SectionHistoryDialog } from "@/components/section-history-dialog";
import { SectionToolbar } from "@/components/rich-text-toolbar";
import { useToast } from "@/components/ui/toast";
import { useInlineEditSlot } from "@/components/inline-edit-context";
import { regenerateOneSection, saveSectionHtml } from "@/lib/proposals/generate-actions";
import { cn } from "@/lib/utils";

export function InlineSectionBody({
  id,
  proposalId,
  section,
}: {
  id: string;
  proposalId: string;
  section: { id: string; key: string; title: string; htmlContent: string };
}) {
  const [savedHtml, setSavedHtml] = useState(section.htmlContent || "<p></p>");
  const { isActive: editing, open, close, ref } = useInlineEditSlot<HTMLDivElement>(id);
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [regenerating, startRegenerateTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);

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
    if (!editor) return;
    if (editing) {
      editor.setEditable(true);
      editor.commands.focus("end");
    } else {
      editor.commands.setContent(savedHtml, { emitUpdate: false });
      editor.setEditable(false);
    }
  }, [editing, editor, savedHtml]);

  function startEditing(e: MouseEvent) {
    if (editing) return;
    if ((e.target as HTMLElement).closest("a")) return;
    open();
  }

  function cancel() {
    close();
  }

  function save() {
    if (!editor) return;
    const html = editor.getHTML();
    startTransition(async () => {
      const result = await saveSectionHtml(proposalId, section.key, html);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedHtml(html);
      close();
    });
  }

  function regenerate() {
    startRegenerateTransition(async () => {
      const result = await regenerateOneSection(proposalId, section.key);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedHtml(result.htmlContent);
      editor?.commands.setContent(result.htmlContent, { emitUpdate: false });
    });
  }

  return (
    <div ref={ref} className="mt-4 space-y-3">
      {editing && (
        <div className="flex flex-wrap items-center gap-2">
          <SectionToolbar editor={editor} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={regenerate}
            loading={regenerating}
            disabled={pending}
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setHistoryOpen(true)}
            disabled={pending || regenerating}
          >
            History
          </Button>
          <Button type="button" size="sm" onClick={save} loading={pending} disabled={regenerating}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={cancel}
            disabled={pending || regenerating}
          >
            Cancel
          </Button>
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

      <SectionHistoryDialog
        proposalId={proposalId}
        sectionKey={section.key}
        sectionTitle={section.title}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestored={(result) => {
          setSavedHtml(result.htmlContent);
          editor?.commands.setContent(result.htmlContent, { emitUpdate: false });
        }}
      />
    </div>
  );
}
