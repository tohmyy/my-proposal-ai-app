"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  extractIntakeFromFile,
  extractIntakeFromSummary,
} from "@/lib/proposals/intake-extraction-actions";
import type { IntakeExtractionResponse } from "@/lib/ai/schema";
import { cn } from "@/lib/utils";

type Mode = "text" | "file";

export function IntakeExtractionPanel({
  onApply,
  mode: controlledMode,
  variant = "collapsible",
}: {
  onApply: (data: IntakeExtractionResponse, sourceText: string) => void;
  /** Lock to paste or upload (used after the new-proposal entry chooser). */
  mode?: Mode;
  /** `embedded` = always open section; `collapsible` = details accordion. */
  variant?: "embedded" | "collapsible";
}) {
  const [internalMode, setInternalMode] = useState<Mode>(controlledMode ?? "text");
  const mode = controlledMode ?? internalMode;
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function handleResult(
    result: Awaited<ReturnType<typeof extractIntakeFromSummary>>,
    sourceText: string,
  ) {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onApply(result.data, sourceText);
    const filledCount = Object.keys(result.data).filter(
      (k) => k !== "notFound",
    ).length;
    const stillMissing = result.data.notFound.length
      ? ` Couldn't find: ${result.data.notFound.join(", ")}.`
      : "";
    toast.success(
      `Filled ${filledCount} field${filledCount === 1 ? "" : "s"} from the ${mode === "text" ? "call summary" : "document"}.${stillMissing}`,
    );
  }

  function onExtractFromText() {
    if (!summary.trim()) {
      toast.error("Paste a call summary first.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("summary", summary);
      const result = await extractIntakeFromSummary(formData);
      handleResult(result, summary);
    });
  }

  function onExtractFromFile() {
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    const isTextFile =
      /\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("document", file);
      const result = await extractIntakeFromFile(formData);
      if (isTextFile && result.ok) {
        const text = await file.text();
        handleResult(result, text);
      } else {
        handleResult(result, `Extracted from uploaded document: ${file.name}`);
      }
    });
  }

  const body = (
    <div className="space-y-4">
      {!controlledMode && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInternalMode("text")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition",
              mode === "text"
                ? "bg-[var(--koya-ink)] text-white"
                : "border border-[var(--koya-line)] text-[var(--koya-ink-soft)] hover:border-[var(--koya-ink)]",
            )}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setInternalMode("file")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition",
              mode === "file"
                ? "bg-[var(--koya-ink)] text-white"
                : "border border-[var(--koya-line)] text-[var(--koya-ink-soft)] hover:border-[var(--koya-ink)]",
            )}
          >
            Upload document
          </button>
        </div>
      )}

      {mode === "text" ? (
        <div className="space-y-2">
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Paste the raw call summary or notes here…"
            rows={6}
          />
          <Button type="button" variant="outline" onClick={onExtractFromText} loading={pending}>
            {pending ? "Extracting…" : "Extract with AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[var(--koya-ink-soft)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--koya-mist)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--koya-ink)] hover:file:bg-black/5"
          />
          <p className="text-xs text-[var(--koya-muted)]">
            PDF or plain text (.txt/.md), up to 15MB.
          </p>
          <Button type="button" variant="outline" onClick={onExtractFromFile} loading={pending}>
            {pending ? "Extracting…" : "Extract with AI"}
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === "embedded") {
    return (
      <section className="space-y-3 rounded-lg border border-[var(--koya-accent)]/35 bg-teal-50/40 px-4 py-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--koya-ink)]">
            {mode === "text" ? "Paste call summary" : "Upload call document"}
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Claude fills empty intake fields from this source. Review
            highlighted gaps below before saving.
          </p>
        </div>
        {body}
      </section>
    );
  }

  return (
    <details className="group rounded-lg border border-[var(--koya-line)] bg-white/60 open:bg-white/80">
      <summary className="cursor-pointer list-none px-4 py-3 select-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="font-[family-name:var(--font-syne)] text-base font-semibold text-[var(--koya-ink)]">
              Fill from a call summary
            </span>
            <p className="mt-0.5 text-sm text-[var(--koya-muted)]">
              Paste notes or upload a document — Claude fills what it can find.
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)] transition group-open:rotate-180">
            ▾
          </span>
        </div>
      </summary>
      <div className="border-t border-[var(--koya-line)] px-4 py-4">{body}</div>
    </details>
  );
}
