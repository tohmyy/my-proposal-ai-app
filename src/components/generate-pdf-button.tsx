"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateProposalPdf } from "@/lib/proposals/generate-actions";

export function GeneratePdfButton({ proposalId }: { proposalId: string }) {
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

  return (
    <Button type="button" variant="outline" onClick={onGenerate} disabled={pending}>
      {pending ? "Generating PDF…" : "Generate PDF"}
    </Button>
  );
}
