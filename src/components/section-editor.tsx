"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SectionHistoryDialog } from "@/components/section-history-dialog";
import { SectionToolbar } from "@/components/rich-text-toolbar";
import { useToast } from "@/components/ui/toast";
import { regenerateOneSection, saveSectionHtml } from "@/lib/proposals/generate-actions";
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
  const router = useRouter();
  const toast = useToast();
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");
  const active = sections.find((s) => s.key === activeKey) ?? sections[0];
  const [pending, startTransition] = useTransition();
  const [regenerating, startRegenerateTransition] = useTransition();

  const [historyOpen, setHistoryOpen] = useState(false);

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
    const html = editor.getHTML();
    startTransition(async () => {
      const result = await saveSectionHtml(proposalId, active.key, html);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Saved “${active.title}”.`);
    });
  }

  function onRegenerate() {
    if (!active) return;
    startRegenerateTransition(async () => {
      const result = await regenerateOneSection(proposalId, active.key);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      editor?.commands.setContent(result.htmlContent, { emitUpdate: false });
      toast.success(`Regenerated “${result.title}”.`);
      router.refresh();
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
            onClick={() => setActiveKey(section.key)}
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
          <div className="flex flex-wrap items-center gap-2">
            <SectionToolbar editor={editor} />
            <Button
              type="button"
              variant="outline"
              onClick={onRegenerate}
              loading={regenerating}
              disabled={pending || !editor}
            >
              {regenerating ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button
              type="button"
              onClick={onSave}
              loading={pending}
              disabled={regenerating || !editor}
            >
              {pending ? "Saving…" : "Save section"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              disabled={!active}
            >
              History
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--koya-line)] bg-white/80 shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>

      {active && (
        <SectionHistoryDialog
          proposalId={proposalId}
          sectionKey={active.key}
          sectionTitle={active.title}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onRestored={(result) => {
            editor?.commands.setContent(result.htmlContent, { emitUpdate: false });
            toast.success(`Restored “${result.title}”.`);
          }}
        />
      )}
    </div>
  );
}
