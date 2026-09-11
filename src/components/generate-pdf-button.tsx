"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateProposalPdf } from "@/lib/proposals/generate-actions";

export function GeneratePdfButton({
  proposalId,
  menuItem = false,
}: {
  proposalId: string;
  /** Render as a full-width menu row instead of an outline button. */
  menuItem?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    startTransition(async () => {
      const result = await generateProposalPdf(proposalId);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  if (menuItem) {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onGenerate}
        disabled={pending}
        className="block w-full px-3 py-2 text-left text-sm font-medium text-[var(--koya-ink)] hover:bg-[var(--koya-mist)] disabled:opacity-50"
      >
        {pending ? "Generating PDF…" : "Generate PDF"}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={onGenerate} loading={pending}>
      {pending ? "Generating PDF…" : "Generate PDF"}
    </Button>
  );
}
