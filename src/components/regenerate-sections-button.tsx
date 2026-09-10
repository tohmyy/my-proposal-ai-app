"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regenerateAffectedSections } from "@/lib/proposals/generate-actions";

export function RegenerateSectionsButton({
  proposalId,
}: {
  proposalId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateAffectedSections(proposalId);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
      if (result.regenerated.length > 0) {
        router.push(`/proposals/${proposalId}/preview`);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={onRegenerate} disabled={pending} size="sm">
        {pending ? "Regenerating…" : "Regenerate these sections"}
      </Button>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
