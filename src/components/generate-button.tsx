"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateProposal } from "@/lib/proposals/generate-actions";

export function GenerateButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateProposal(proposalId);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
      if (result.status === "in_review" || result.sectionCount > 0) {
        router.push(`/proposals/${proposalId}/preview`);
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button type="button" onClick={onGenerate} disabled={pending} size="lg">
        {pending ? "Generating…" : "Generate with AI"}
      </Button>
      {error && (
        <p className="max-w-xs text-right text-sm text-rose-700">{error}</p>
      )}
    </div>
  );
}
