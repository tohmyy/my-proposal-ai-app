"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  listSectionRevisions,
  restoreSectionRevision,
} from "@/lib/proposals/section-revisions";
import type { ProposalSectionRevision } from "@/db/schema";

const SOURCE_LABELS: Record<string, string> = {
  initial_generate: "AI generated (initial)",
  selective_regen: "AI regenerated (intake update)",
  manual_reword: "AI reworded (manual)",
  human_edit: "Manually edited",
  restored: "Restored from an earlier version",
  cache_hit: "Reused a previous version (no AI call)",
};

export function SectionHistoryDialog({
  proposalId,
  sectionKey,
  sectionTitle,
  open,
  onOpenChange,
  onRestored,
}: {
  proposalId: string;
  sectionKey: string;
  sectionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: (result: { title: string; htmlContent: string }) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [restorePending, startRestoreTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<ProposalSectionRevision[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      setError(null);
      setIndex(0);
      const result = await listSectionRevisions(proposalId, sectionKey);
      setRevisions(result);
      setIndex(0);
    });
  }, [open, proposalId, sectionKey]);

  function onRestore(revisionId: string) {
    startRestoreTransition(async () => {
      const result = await restoreSectionRevision(proposalId, revisionId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onRestored({ title: result.title, htmlContent: result.htmlContent });
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="shrink-0">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Version history — {sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Every version this section has had. Restoring makes it the live content again.
          </p>
        </div>

        {pending && <p className="shrink-0 text-sm text-[var(--koya-muted)]">Loading…</p>}
        {error && <p className="shrink-0 text-sm text-rose-700">{error}</p>}

        {!pending && revisions.length === 0 && (
          <p className="shrink-0 text-sm text-[var(--koya-muted)]">No history yet.</p>
        )}

        {!pending && revisions.length > 0 && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Newer version"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--koya-ink)]">
                  {SOURCE_LABELS[revisions[index].source] ?? revisions[index].source}
                </p>
                <p className="text-xs text-[var(--koya-muted)]">
                  Version {index + 1} of {revisions.length} —{" "}
                  {new Date(revisions[index].createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Older version"
                onClick={() => setIndex((i) => Math.min(revisions.length - 1, i + 1))}
                disabled={index === revisions.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--koya-line)] bg-white px-4 py-3">
              <div
                className="prose-koya"
                dangerouslySetInnerHTML={{ __html: revisions[index].htmlContent }}
              />
            </div>

            <div className="flex shrink-0 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => onRestore(revisions[index].id)}
                loading={restorePending}
                disabled={index === 0}
              >
                {restorePending ? "Restoring…" : "Restore this version"}
              </Button>
            </div>
          </>
        )}

        <div className="flex shrink-0 justify-end border-t border-[var(--koya-line)] pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
