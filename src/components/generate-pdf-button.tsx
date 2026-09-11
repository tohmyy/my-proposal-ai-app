"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateProposalPdf } from "@/lib/proposals/generate-actions";

export function GeneratePdfButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateProposalPdf(proposalId);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" onClick={onGenerate} disabled={pending}>
        {pending ? "Generating PDF…" : "Generate PDF"}
      </Button>
      {error && <p className="max-w-xs text-right text-sm text-rose-700">{error}</p>}
    </div>
  );
}
